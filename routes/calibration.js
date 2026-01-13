/**
 * Calibration & Uncertainty API Routes
 *
 * Provides endpoints for uncertainty calibration tracking and prediction management.
 * Production-only: All data comes from enhanced-memory SQLite database.
 *
 * Compatible with existing MCP uncertainty_predictions table schema:
 * - prediction_id TEXT PRIMARY KEY
 * - domain TEXT NOT NULL
 * - prediction TEXT NOT NULL
 * - confidence REAL NOT NULL
 * - actual_outcome TEXT
 * - was_correct INTEGER
 * - timestamp REAL NOT NULL
 * - metadata TEXT
 * - created_at TIMESTAMP
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Database path - use environment variable or default location
const DB_PATH = process.env.ENHANCED_MEMORY_DB || path.join(os.homedir(), '.claude/enhanced_memories/memory.db');

// Create database connection with appropriate mode
function getDatabase(readOnly = true) {
  const mode = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
  return new sqlite3.Database(DB_PATH, mode, (err) => {
    if (err) {
      console.error('[Calibration API] Database connection error:', err.message);
    }
  });
}

// Promisify database queries
function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Calculate Expected Calibration Error (ECE)
 * Groups predictions into bins by confidence and measures deviation from actual accuracy
 */
function calculateECE(predictions, numBins = 10) {
  if (!predictions.length) return null;

  const bins = Array(numBins).fill(null).map(() => ({ correct: 0, total: 0, confidence_sum: 0 }));

  predictions.forEach(p => {
    const binIndex = Math.min(Math.floor(p.confidence * numBins), numBins - 1);
    bins[binIndex].total++;
    bins[binIndex].confidence_sum += p.confidence;
    if (p.was_correct) bins[binIndex].correct++;
  });

  let ece = 0;
  const total = predictions.length;

  bins.forEach(bin => {
    if (bin.total > 0) {
      const accuracy = bin.correct / bin.total;
      const avgConfidence = bin.confidence_sum / bin.total;
      ece += (bin.total / total) * Math.abs(accuracy - avgConfidence);
    }
  });

  return ece;
}

/**
 * Calculate Maximum Calibration Error (MCE)
 * Returns worst-case calibration error across all bins
 */
function calculateMCE(predictions, numBins = 10) {
  if (!predictions.length) return null;

  const bins = Array(numBins).fill(null).map(() => ({ correct: 0, total: 0, confidence_sum: 0 }));

  predictions.forEach(p => {
    const binIndex = Math.min(Math.floor(p.confidence * numBins), numBins - 1);
    bins[binIndex].total++;
    bins[binIndex].confidence_sum += p.confidence;
    if (p.was_correct) bins[binIndex].correct++;
  });

  let mce = 0;

  bins.forEach(bin => {
    if (bin.total > 0) {
      const accuracy = bin.correct / bin.total;
      const avgConfidence = bin.confidence_sum / bin.total;
      mce = Math.max(mce, Math.abs(accuracy - avgConfidence));
    }
  });

  return mce;
}

/**
 * Calculate Brier Score
 * Mean squared error between predicted probability and actual outcome
 */
function calculateBrierScore(predictions) {
  if (!predictions.length) return null;

  const sum = predictions.reduce((acc, p) => {
    const outcome = p.was_correct ? 1 : 0;
    return acc + Math.pow(p.confidence - outcome, 2);
  }, 0);

  return sum / predictions.length;
}

/**
 * GET /api/calibration/report
 * Get comprehensive calibration report with metrics and recommendations
 */
router.get('/report', async (req, res) => {
  const db = getDatabase();

  try {
    const domain = req.query.domain || null;

    // Get all resolved predictions (where actual_outcome is not null)
    let sql = `
      SELECT domain, prediction, confidence, was_correct, created_at
      FROM uncertainty_predictions
      WHERE actual_outcome IS NOT NULL
    `;
    const params = [];

    if (domain) {
      sql += ' AND domain = ?';
      params.push(domain);
    }

    const predictions = await dbAll(db, sql, params);

    // Calculate overall metrics
    const ece = calculateECE(predictions);
    const mce = calculateMCE(predictions);
    const brierScore = calculateBrierScore(predictions);

    // Calculate domain-specific metrics
    const domainMetrics = {};
    const domainGroups = {};

    predictions.forEach(p => {
      if (!domainGroups[p.domain]) domainGroups[p.domain] = [];
      domainGroups[p.domain].push(p);
    });

    Object.entries(domainGroups).forEach(([domain, preds]) => {
      domainMetrics[domain] = {
        ece: calculateECE(preds),
        mce: calculateMCE(preds),
        brier_score: calculateBrierScore(preds),
        total_predictions: preds.length,
        accuracy: preds.filter(p => p.was_correct).length / preds.length
      };
    });

    // Generate recommendations
    const recommendations = [];
    if (ece !== null && ece > 0.10) {
      recommendations.push('ECE is above 0.10 - consider adjusting confidence estimates');
    }
    if (ece !== null && ece > 0.05) {
      recommendations.push('For better calibration, focus on domains with highest error');
    }

    // Check for overconfidence in specific domains
    Object.entries(domainMetrics).forEach(([domain, metrics]) => {
      if (metrics.ece > 0.15) {
        recommendations.push(`Domain "${domain}" has high calibration error (${metrics.ece.toFixed(3)}) - needs attention`);
      }
      if (metrics.accuracy < 0.5 && metrics.total_predictions >= 5) {
        recommendations.push(`Domain "${domain}" has low accuracy (${(metrics.accuracy * 100).toFixed(0)}%) - review prediction criteria`);
      }
    });

    if (predictions.length < 10) {
      recommendations.push('Record more predictions to improve calibration accuracy');
    }

    res.json({
      overall_metrics: {
        ece: ece !== null ? parseFloat(ece.toFixed(4)) : null,
        mce: mce !== null ? parseFloat(mce.toFixed(4)) : null,
        brier_score: brierScore !== null ? parseFloat(brierScore.toFixed(4)) : null,
        total_predictions: predictions.length,
        accuracy: predictions.length > 0
          ? parseFloat((predictions.filter(p => p.was_correct).length / predictions.length).toFixed(4))
          : null
      },
      domain_metrics: domainMetrics,
      recommendations: recommendations.slice(0, 5),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calibration API] Error generating report:', error.message);
    res.status(503).json({
      success: false,
      error: 'Database query failed',
      details: error.message
    });
  } finally {
    db.close();
  }
});

/**
 * GET /api/calibration/predictions
 * Get all predictions with optional status filter
 */
router.get('/predictions', async (req, res) => {
  const db = getDatabase();

  try {
    const status = req.query.status || null;
    const limit = parseInt(req.query.limit) || 100;

    let sql = `
      SELECT
        prediction_id as id,
        domain,
        prediction,
        confidence,
        CASE WHEN actual_outcome IS NULL THEN 'pending' ELSE 'resolved' END as status,
        actual_outcome,
        was_correct,
        created_at
      FROM uncertainty_predictions
    `;
    const params = [];

    if (status === 'pending') {
      sql += ' WHERE actual_outcome IS NULL';
    } else if (status === 'resolved') {
      sql += ' WHERE actual_outcome IS NOT NULL';
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const predictions = await dbAll(db, sql, params);

    res.json({
      predictions: predictions.map(p => ({
        id: p.id,
        domain: p.domain,
        prediction: p.prediction,
        confidence: parseFloat(p.confidence),
        status: p.status,
        actual_outcome: p.actual_outcome,
        was_correct: p.was_correct === 1,
        created_at: p.created_at
      })),
      count: predictions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calibration API] Error fetching predictions:', error.message);
    res.status(503).json({
      success: false,
      error: 'Database query failed',
      details: error.message
    });
  } finally {
    db.close();
  }
});

/**
 * GET /api/calibration/trend
 * Get calibration trend over time
 */
router.get('/trend', async (req, res) => {
  const db = getDatabase();

  try {
    const days = parseInt(req.query.days) || 7;

    // Get daily aggregated metrics (using created_at for resolved predictions)
    const dailyData = await dbAll(db, `
      SELECT
        date(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN was_correct = 1 THEN 1 ELSE 0 END) as correct,
        AVG(confidence) as avg_confidence
      FROM uncertainty_predictions
      WHERE actual_outcome IS NOT NULL
        AND created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `, [days]);

    // Calculate daily metrics
    const trend = dailyData.map(day => {
      const accuracy = day.total > 0 ? day.correct / day.total : 0;
      const avgConf = day.avg_confidence || 0;

      return {
        date: day.date,
        total_predictions: day.total,
        accuracy: parseFloat(accuracy.toFixed(4)),
        avg_confidence: parseFloat(avgConf.toFixed(4)),
        ece: Math.abs(accuracy - avgConf),
        brier: day.total > 0 ? parseFloat((Math.pow(avgConf - accuracy, 2)).toFixed(4)) : 0
      };
    });

    res.json({
      trend,
      days,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calibration API] Error fetching trend:', error.message);
    res.status(503).json({
      success: false,
      error: 'Database query failed',
      details: error.message
    });
  } finally {
    db.close();
  }
});

/**
 * POST /api/calibration/record
 * Record a new prediction (compatible with existing MCP table)
 */
router.post('/record', async (req, res) => {
  const db = getDatabase(false); // Read-write mode

  try {
    const { domain, prediction, confidence, metadata } = req.body;

    if (!domain || !prediction || confidence === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, prediction, confidence'
      });
    }

    const predictionId = crypto.randomUUID();
    const timestamp = Date.now() / 1000; // Unix timestamp in seconds

    await dbRun(db, `
      INSERT INTO uncertainty_predictions (prediction_id, domain, prediction, confidence, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [predictionId, domain, prediction, confidence, timestamp, metadata ? JSON.stringify(metadata) : null]);

    res.json({
      success: true,
      prediction_id: predictionId,
      message: 'Prediction recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calibration API] Error recording prediction:', error.message);
    res.status(503).json({
      success: false,
      error: 'Database operation failed',
      details: error.message
    });
  } finally {
    db.close();
  }
});

/**
 * POST /api/calibration/resolve
 * Resolve a prediction with actual outcome
 */
router.post('/resolve', async (req, res) => {
  const db = getDatabase(false); // Read-write mode

  try {
    const { prediction_id, actual_outcome, was_correct } = req.body;

    if (!prediction_id || !actual_outcome || was_correct === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prediction_id, actual_outcome, was_correct'
      });
    }

    const result = await dbRun(db, `
      UPDATE uncertainty_predictions
      SET actual_outcome = ?,
          was_correct = ?
      WHERE prediction_id = ?
    `, [actual_outcome, was_correct ? 1 : 0, prediction_id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      });
    }

    // Get the resolved prediction for calibration impact
    const prediction = await dbGet(db, `
      SELECT confidence, was_correct FROM uncertainty_predictions WHERE prediction_id = ?
    `, [prediction_id]);

    res.json({
      success: true,
      message: 'Prediction resolved successfully',
      calibration_impact: {
        confidence: parseFloat(prediction.confidence),
        was_correct: prediction.was_correct === 1,
        squared_error: Math.pow(prediction.confidence - (prediction.was_correct === 1 ? 1 : 0), 2)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calibration API] Error resolving prediction:', error.message);
    res.status(503).json({
      success: false,
      error: 'Database operation failed',
      details: error.message
    });
  } finally {
    db.close();
  }
});

/**
 * POST /api/calibration/adjust
 * Get calibration-adjusted confidence for a domain
 */
router.post('/adjust', async (req, res) => {
  const db = getDatabase();

  try {
    const { domain, baseConfidence } = req.body;

    if (!domain || baseConfidence === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, baseConfidence'
      });
    }

    // Get historical accuracy for this domain (resolved predictions)
    const domainStats = await dbGet(db, `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN was_correct = 1 THEN 1 ELSE 0 END) as correct,
        AVG(confidence) as avg_confidence
      FROM uncertainty_predictions
      WHERE domain = ? AND actual_outcome IS NOT NULL
    `, [domain]);

    let adjustedConfidence = baseConfidence;
    let reasoning = '';

    if (domainStats && domainStats.total >= 5) {
      const historicalAccuracy = domainStats.correct / domainStats.total;
      const avgConfidence = domainStats.avg_confidence;

      // Calculate calibration adjustment
      const overconfidence = avgConfidence - historicalAccuracy;

      if (overconfidence > 0.1) {
        // Historically overconfident - reduce confidence
        adjustedConfidence = Math.max(0.1, baseConfidence - overconfidence * 0.5);
        reasoning = `Historically overconfident in ${domain} by ${(overconfidence * 100).toFixed(0)}%. Reducing confidence.`;
      } else if (overconfidence < -0.1) {
        // Historically underconfident - increase confidence
        adjustedConfidence = Math.min(0.95, baseConfidence - overconfidence * 0.5);
        reasoning = `Historically underconfident in ${domain}. Increasing confidence.`;
      } else {
        // Well calibrated
        adjustedConfidence = baseConfidence;
        reasoning = `${domain} predictions are well-calibrated. No adjustment needed.`;
      }
    } else {
      reasoning = `Insufficient data for ${domain} (${domainStats?.total || 0} resolved predictions). Using base confidence.`;
    }

    res.json({
      domain,
      base_confidence: parseFloat(baseConfidence),
      adjusted_confidence: parseFloat(adjustedConfidence.toFixed(3)),
      reasoning,
      historical_stats: domainStats ? {
        total_predictions: domainStats.total,
        accuracy: domainStats.total > 0 ? parseFloat((domainStats.correct / domainStats.total).toFixed(3)) : null,
        avg_confidence: parseFloat((domainStats.avg_confidence || 0).toFixed(3))
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calibration API] Error adjusting confidence:', error.message);
    res.status(503).json({
      success: false,
      error: 'Database query failed',
      details: error.message
    });
  } finally {
    db.close();
  }
});

/**
 * GET /api/calibration/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  const db = getDatabase();

  try {
    // Check if table exists and get count
    const result = await dbGet(db, `
      SELECT COUNT(*) as count FROM uncertainty_predictions
    `).catch(() => null);

    res.json({
      success: true,
      healthy: true,
      database: {
        path: DB_PATH,
        connected: true,
        prediction_count: result?.count || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      healthy: false,
      database: {
        path: DB_PATH,
        connected: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  } finally {
    db.close();
  }
});

module.exports = router;

/**
 * Curiosity Engine API Routes
 *
 * Provides endpoints for curiosity-driven exploration using direct SQLite queries.
 * Production-only: All data comes from enhanced-memory SQLite database.
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

// Database path - use environment variable or default location
const DB_PATH = process.env.ENHANCED_MEMORY_DB || path.join(os.homedir(), '.claude/enhanced_memories/memory.db');

// Create database connection with error handling
function getDatabase() {
  return new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('[Curiosity API] Database connection error:', err.message);
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
 * GET /api/curiosity/status
 * Get current curiosity state from database
 */
router.get('/status', async (req, res) => {
  const db = getDatabase();

  try {
    // Get knowledge gap statistics
    const gapStats = await dbGet(db, `
      SELECT
        COUNT(*) as total_gaps,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_gaps,
        SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning_gaps,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_gaps,
        AVG(severity) as avg_severity,
        AVG(learning_progress) as avg_progress
      FROM knowledge_gaps
    `);

    // Get domain distribution
    const domains = await dbAll(db, `
      SELECT domain, COUNT(*) as count, AVG(severity) as avg_severity
      FROM knowledge_gaps
      GROUP BY domain
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get recent exploration episodes
    const recentExplorations = await dbGet(db, `
      SELECT COUNT(*) as count
      FROM episodic_memory
      WHERE created_at > datetime('now', '-24 hours')
    `);

    // Get entity growth (curiosity indicator)
    const entityGrowth = await dbGet(db, `
      SELECT
        COUNT(*) as total_entities,
        SUM(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as new_today,
        SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as new_this_week
      FROM entities
    `);

    // Calculate curiosity score (0-1 scale)
    const openGaps = gapStats?.open_gaps || 0;
    const avgSeverity = gapStats?.avg_severity || 0;
    const newEntities = entityGrowth?.new_today || 0;
    const curiosityScore = Math.min(1, (openGaps * avgSeverity * 0.3 + newEntities * 0.01) / 10);

    res.json({
      success: true,
      data: {
        curiosity_score: parseFloat(curiosityScore.toFixed(3)),
        knowledge_gaps: {
          total: gapStats?.total_gaps || 0,
          open: gapStats?.open_gaps || 0,
          learning: gapStats?.learning_gaps || 0,
          resolved: gapStats?.resolved_gaps || 0,
          average_severity: parseFloat((gapStats?.avg_severity || 0).toFixed(3)),
          average_progress: parseFloat((gapStats?.avg_progress || 0).toFixed(3))
        },
        domains: domains.map(d => ({
          name: d.domain,
          gap_count: d.count,
          avg_severity: parseFloat((d.avg_severity || 0).toFixed(3))
        })),
        exploration: {
          recent_24h: recentExplorations?.count || 0,
          entities_total: entityGrowth?.total_entities || 0,
          entities_today: entityGrowth?.new_today || 0,
          entities_this_week: entityGrowth?.new_this_week || 0
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Curiosity API] Error fetching status:', error.message);
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
 * GET /api/curiosity/targets
 * Get exploration targets ranked by priority
 */
router.get('/targets', async (req, res) => {
  const db = getDatabase();

  try {
    const numTargets = parseInt(req.query.num_targets) || 10;
    const preferGaps = req.query.prefer_gaps !== 'false';

    let targets = [];

    if (preferGaps) {
      // Get open knowledge gaps as primary targets
      const gaps = await dbAll(db, `
        SELECT
          gap_id as id,
          domain,
          gap_description as description,
          gap_type as type,
          severity,
          learning_progress as progress,
          discovered_at,
          'knowledge_gap' as target_type
        FROM knowledge_gaps
        WHERE status = 'open'
        ORDER BY severity DESC, discovered_at DESC
        LIMIT ?
      `, [numTargets]);

      targets = gaps.map(g => ({
        id: g.id,
        domain: g.domain,
        description: g.description,
        type: g.type,
        priority: parseFloat((g.severity || 0).toFixed(3)),
        progress: parseFloat((g.progress || 0).toFixed(3)),
        discovered_at: g.discovered_at,
        target_type: g.target_type
      }));
    }

    // If not enough gaps, add entity-based targets
    if (targets.length < numTargets) {
      const remaining = numTargets - targets.length;
      const entityTargets = await dbAll(db, `
        SELECT DISTINCT
          e.entity_type as domain,
          e.name as description,
          COUNT(*) as entity_count,
          'entity_cluster' as target_type
        FROM entities e
        WHERE e.entity_type NOT IN ('service_event', 'session_event')
        GROUP BY e.entity_type
        HAVING COUNT(*) < 10
        ORDER BY COUNT(*) ASC
        LIMIT ?
      `, [remaining]);

      entityTargets.forEach(et => {
        targets.push({
          id: `entity_${et.domain}`,
          domain: et.domain,
          description: `Explore ${et.domain} (${et.entity_count} known entities)`,
          type: 'exploration',
          priority: 0.5,
          progress: 0,
          target_type: et.target_type
        });
      });
    }

    res.json({
      success: true,
      data: {
        targets,
        count: targets.length,
        prefer_gaps: preferGaps,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Curiosity API] Error fetching targets:', error.message);
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
 * POST /api/curiosity/score
 * Compute curiosity score for content
 */
router.post('/score', async (req, res) => {
  const db = getDatabase();

  try {
    const { content, domain } = req.body;

    if (!content || !domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content and domain'
      });
    }

    // Check for existing similar content (novelty check)
    const existingCount = await dbGet(db, `
      SELECT COUNT(*) as count
      FROM entities e
      JOIN observations o ON e.id = o.entity_id
      WHERE e.entity_type = ? AND o.content LIKE ?
    `, [domain, `%${content.substring(0, 50)}%`]);

    // Check domain knowledge gaps
    const domainGaps = await dbGet(db, `
      SELECT COUNT(*) as count, AVG(severity) as avg_severity
      FROM knowledge_gaps
      WHERE domain = ? AND status = 'open'
    `, [domain]);

    // Calculate novelty (inverse of existing similar content)
    const novelty = Math.max(0, 1 - (existingCount?.count || 0) * 0.1);

    // Info gain based on domain gaps
    const infoGain = (domainGaps?.avg_severity || 0.5) * (domainGaps?.count || 1) * 0.2;

    // Learning progress (domain competence)
    const domainCompetence = await dbGet(db, `
      SELECT AVG(learning_progress) as avg_progress
      FROM knowledge_gaps
      WHERE domain = ?
    `, [domain]);
    const learningProgress = 1 - (domainCompetence?.avg_progress || 0.5);

    // Combined curiosity score
    const curiosityScore = (novelty * 0.4 + infoGain * 0.35 + learningProgress * 0.25);

    res.json({
      success: true,
      data: {
        curiosity_score: parseFloat(curiosityScore.toFixed(3)),
        components: {
          novelty: parseFloat(novelty.toFixed(3)),
          info_gain: parseFloat(infoGain.toFixed(3)),
          learning_progress: parseFloat(learningProgress.toFixed(3))
        },
        domain_stats: {
          existing_similar: existingCount?.count || 0,
          open_gaps: domainGaps?.count || 0,
          avg_gap_severity: parseFloat((domainGaps?.avg_severity || 0).toFixed(3))
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Curiosity API] Error computing score:', error.message);
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
 * GET /api/curiosity/observations
 * Get exploration observation history
 */
router.get('/observations', async (req, res) => {
  const db = getDatabase();

  try {
    const limit = parseInt(req.query.limit) || 50;
    const eventType = req.query.event_type || null;

    let sql = `
      SELECT
        em.id,
        em.event_type,
        em.episode_data,
        em.significance_score,
        em.emotional_valence,
        em.tags,
        em.created_at,
        e.name as entity_name,
        e.entity_type
      FROM episodic_memory em
      LEFT JOIN entities e ON em.entity_id = e.id
    `;

    const params = [];
    if (eventType) {
      sql += ' WHERE em.event_type = ?';
      params.push(eventType);
    }

    sql += ' ORDER BY em.created_at DESC LIMIT ?';
    params.push(limit);

    const observations = await dbAll(db, sql, params);

    res.json({
      success: true,
      data: {
        observations: observations.map(o => ({
          id: o.id,
          event_type: o.event_type,
          data: safeJsonParse(o.episode_data),
          significance: parseFloat((o.significance_score || 0).toFixed(3)),
          emotional_valence: o.emotional_valence,
          tags: safeJsonParse(o.tags) || [],
          created_at: o.created_at,
          entity: o.entity_name ? {
            name: o.entity_name,
            type: o.entity_type
          } : null
        })),
        count: observations.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Curiosity API] Error fetching observations:', error.message);
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
 * POST /api/curiosity/observe
 * Record an exploration observation (read-only - returns what would be recorded)
 */
router.post('/observe', async (req, res) => {
  const db = getDatabase();

  try {
    const { content, domain, source } = req.body;

    if (!content || !domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content and domain'
      });
    }

    // Calculate what novelty/info gain this observation would have
    const existingCount = await dbGet(db, `
      SELECT COUNT(*) as count FROM entities WHERE entity_type = ?
    `, [domain]);

    const novelty = Math.max(0, 1 - (existingCount?.count || 0) * 0.01);
    const infoGain = novelty * 0.8;

    res.json({
      success: true,
      data: {
        message: 'Observation analysis complete (read-only mode)',
        would_record: {
          content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          domain,
          source: source || 'manual',
          novelty: parseFloat(novelty.toFixed(3)),
          info_gain: parseFloat(infoGain.toFixed(3))
        },
        domain_stats: {
          existing_entities: existingCount?.count || 0
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Curiosity API] Error analyzing observation:', error.message);
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
 * POST /api/curiosity/identify-gap
 * Identify a knowledge gap (read-only - analyzes what gap would be created)
 */
router.post('/identify-gap', async (req, res) => {
  const db = getDatabase();

  try {
    const { domain, topic, importance } = req.body;

    if (!domain || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain and topic'
      });
    }

    // Check for existing similar gaps
    const existingGap = await dbGet(db, `
      SELECT * FROM knowledge_gaps
      WHERE domain = ? AND gap_description LIKE ?
      LIMIT 1
    `, [domain, `%${topic.substring(0, 30)}%`]);

    if (existingGap) {
      res.json({
        success: true,
        data: {
          message: 'Similar gap already exists',
          existing_gap: {
            id: existingGap.gap_id,
            domain: existingGap.domain,
            description: existingGap.gap_description,
            severity: existingGap.severity,
            status: existingGap.status,
            progress: existingGap.learning_progress
          },
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          message: 'Gap analysis complete (read-only mode)',
          would_create: {
            domain,
            topic,
            importance: importance || 0.5,
            gap_type: 'factual'
          },
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('[Curiosity API] Error analyzing gap:', error.message);
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
 * GET /api/curiosity/gaps
 * Get knowledge gaps
 */
router.get('/gaps', async (req, res) => {
  const db = getDatabase();

  try {
    const minImportance = parseFloat(req.query.min_importance) || 0.0;
    const status = req.query.status || null;
    const domain = req.query.domain || null;
    const limit = parseInt(req.query.limit) || 50;

    let sql = `
      SELECT
        gap_id as id,
        agent_id,
        domain,
        gap_description as description,
        gap_type as type,
        severity,
        status,
        learning_progress as progress,
        learning_plan,
        discovered_at,
        discovered_by,
        resolved_at,
        resolution_notes
      FROM knowledge_gaps
      WHERE severity >= ?
    `;
    const params = [minImportance];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (domain) {
      sql += ' AND domain = ?';
      params.push(domain);
    }

    sql += ' ORDER BY severity DESC, discovered_at DESC LIMIT ?';
    params.push(limit);

    const gaps = await dbAll(db, sql, params);

    res.json({
      success: true,
      data: {
        gaps: gaps.map(g => ({
          id: g.id,
          agent_id: g.agent_id,
          domain: g.domain,
          description: g.description,
          type: g.type,
          severity: parseFloat((g.severity || 0).toFixed(3)),
          status: g.status,
          progress: parseFloat((g.progress || 0).toFixed(3)),
          learning_plan: safeJsonParse(g.learning_plan),
          discovered_at: g.discovered_at,
          discovered_by: g.discovered_by,
          resolved_at: g.resolved_at,
          resolution_notes: g.resolution_notes
        })),
        count: gaps.length,
        filters: {
          min_importance: minImportance,
          status: status || 'all',
          domain: domain || 'all'
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Curiosity API] Error fetching gaps:', error.message);
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
 * GET /api/curiosity/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  const db = getDatabase();

  try {
    // Simple query to verify database connection
    const result = await dbGet(db, 'SELECT COUNT(*) as count FROM entities');

    res.json({
      success: true,
      healthy: true,
      database: {
        path: DB_PATH,
        connected: true,
        entity_count: result?.count || 0
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

// Helper function for safe JSON parsing
function safeJsonParse(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

module.exports = router;

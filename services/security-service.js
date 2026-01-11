/**
 * Security Service for KutiraAI Dashboard
 * ========================================
 *
 * Provides security monitoring stats from:
 * - Threat intelligence feeds (threat-intel-mcp)
 * - Memory integrity (enhanced-memory-mcp)
 * - Prompt injection detection (hook system)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const AGENTIC_SYSTEM = '/Volumes/SSDRAID0/agentic-system';
const THREAT_DB = path.join(AGENTIC_SYSTEM, 'mcp-servers/threat-intel-mcp/data/threat_intel.db');
const MEMORY_DB = path.join(process.env.HOME, '.claude/enhanced_memories/memory.db');
const INJECTION_LOG = path.join(process.env.HOME, '.claude/logs/prompt_injection_detections.jsonl');

/**
 * Execute SQLite query and return results
 */
function queryDatabase(dbPath, sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!fsSync.existsSync(dbPath)) {
      resolve([]);
      return;
    }

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        resolve([]);
        return;
      }

      db.all(sql, params, (err, rows) => {
        db.close();
        if (err) {
          resolve([]);
          return;
        }
        resolve(rows || []);
      });
    });
  });
}

/**
 * Get threat intelligence statistics
 */
async function getThreatIntelStats() {
  const stats = {
    totalIndicators: 0,
    byType: {},
    bySource: {},
    cisaKevCount: 0,
    lastSync: null,
    available: false
  };

  if (!fsSync.existsSync(THREAT_DB)) {
    return stats;
  }

  stats.available = true;

  try {
    // Total indicators
    const total = await queryDatabase(THREAT_DB, 'SELECT COUNT(*) as count FROM indicators');
    stats.totalIndicators = total[0]?.count || 0;

    // By type
    const byType = await queryDatabase(THREAT_DB, `
      SELECT indicator_type, COUNT(*) as count
      FROM indicators
      GROUP BY indicator_type
    `);
    stats.byType = Object.fromEntries(byType.map(r => [r.indicator_type, r.count]));

    // By source (top 5)
    const bySource = await queryDatabase(THREAT_DB, `
      SELECT source, COUNT(*) as count
      FROM indicators
      GROUP BY source
      ORDER BY count DESC
      LIMIT 5
    `);
    stats.bySource = Object.fromEntries(bySource.map(r => [r.source, r.count]));

    // CISA KEV count
    const kev = await queryDatabase(THREAT_DB, 'SELECT COUNT(*) as count FROM cisa_kev');
    stats.cisaKevCount = kev[0]?.count || 0;

    // Last sync (file modification time)
    const dbStats = await fs.stat(THREAT_DB);
    stats.lastSync = dbStats.mtime.toISOString();
  } catch (error) {
    stats.error = error.message;
  }

  return stats;
}

/**
 * Get memory integrity statistics
 */
async function getMemoryIntegrityStats() {
  const stats = {
    totalEntities: 0,
    signed: 0,
    unsigned: 0,
    tampered: 0,
    coverage: 0,
    available: false
  };

  if (!fsSync.existsSync(MEMORY_DB)) {
    return stats;
  }

  stats.available = true;

  try {
    // Total entities
    const total = await queryDatabase(MEMORY_DB, 'SELECT COUNT(*) as count FROM entities');
    stats.totalEntities = total[0]?.count || 0;

    // Check integrity_status column (signatures stored as columns in entities table)
    // Status: 'verified' = signed, 'unsigned' = not signed, 'tampered' = modified after signing
    const statusCounts = await queryDatabase(MEMORY_DB, `
      SELECT integrity_status, COUNT(*) as count
      FROM entities
      GROUP BY integrity_status
    `);

    for (const row of statusCounts) {
      if (row.integrity_status === 'verified') {
        stats.signed += row.count;
      } else if (row.integrity_status === 'tampered') {
        stats.tampered += row.count;
      } else {
        // NULL or 'unsigned'
        stats.unsigned += row.count;
      }
    }

    // Calculate coverage percentage
    if (stats.totalEntities > 0) {
      stats.coverage = Math.round((stats.signed / stats.totalEntities) * 100);
    }
  } catch (error) {
    stats.error = error.message;
  }

  return stats;
}

/**
 * Get prompt injection detection statistics
 */
async function getInjectionStats() {
  const stats = {
    totalScans: 0,
    detections24h: 0,
    byRisk: { critical: 0, high: 0, medium: 0, low: 0 },
    byType: {},
    recentDetections: [],
    available: false
  };

  if (!fsSync.existsSync(INJECTION_LOG)) {
    return stats;
  }

  stats.available = true;
  const now = new Date();
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const content = await fs.readFile(INJECTION_LOG, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        stats.totalScans++;

        // Parse timestamp
        const ts = new Date(entry.timestamp?.replace('Z', '+00:00') || 0);

        // Count 24h detections
        if (ts > cutoff24h) {
          stats.detections24h++;

          // By risk
          const risk = entry.risk_level || 'unknown';
          if (stats.byRisk[risk] !== undefined) {
            stats.byRisk[risk]++;
          }

          // By type
          for (const det of (entry.detections || [])) {
            const detType = det.injection_type || 'unknown';
            stats.byType[detType] = (stats.byType[detType] || 0) + 1;
          }

          // Recent (last 10)
          if (stats.recentDetections.length < 10) {
            stats.recentDetections.push({
              timestamp: entry.timestamp,
              context: entry.context || 'unknown',
              riskLevel: risk
            });
          }
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch (error) {
    stats.error = error.message;
  }

  return stats;
}

/**
 * Calculate overall security health score
 */
async function getSecurityHealth() {
  const [threatStats, memoryStats, injectionStats] = await Promise.all([
    getThreatIntelStats(),
    getMemoryIntegrityStats(),
    getInjectionStats()
  ]);

  let score = 100;

  // Deduct for unsigned entities
  if (memoryStats.available && memoryStats.totalEntities > 0) {
    const unsignedPct = memoryStats.unsigned / memoryStats.totalEntities;
    score -= Math.round(unsignedPct * 20);
  }

  // Deduct for critical/high injections
  if (injectionStats.available) {
    score -= injectionStats.byRisk.critical * 10;
    score -= injectionStats.byRisk.high * 5;
  }

  score = Math.max(0, score);

  // Determine status
  let status, statusColor;
  if (score >= 90) {
    status = 'healthy';
    statusColor = '#22c55e';
  } else if (score >= 70) {
    status = 'warning';
    statusColor = '#eab308';
  } else {
    status = 'critical';
    statusColor = '#ef4444';
  }

  return {
    score,
    status,
    statusColor,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get all security stats in one call
 */
async function getAllSecurityStats() {
  const [health, threatIntel, memory, injection] = await Promise.all([
    getSecurityHealth(),
    getThreatIntelStats(),
    getMemoryIntegrityStats(),
    getInjectionStats()
  ]);

  return {
    health,
    threatIntel,
    memory,
    injection
  };
}

module.exports = {
  getThreatIntelStats,
  getMemoryIntegrityStats,
  getInjectionStats,
  getSecurityHealth,
  getAllSecurityStats
};

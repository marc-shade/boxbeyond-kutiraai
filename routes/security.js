/**
 * Security API Routes
 * Exposes security MCP capabilities:
 * - Threat intelligence feeds (Feodo, URLhaus, CISA KEV)
 * - Network scanning and vulnerability assessment
 * - HIDS event monitoring
 * - IP and hash reputation checking
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Security MCP servers (typically on different ports)
const SECURITY_PENTESTING_PORT = process.env.SECURITY_PENTESTING_PORT || 8103;
const SECURITY_PENTESTING_URL = `http://localhost:${SECURITY_PENTESTING_PORT}`;

/**
 * GET /api/security/threat-feeds/:type
 * Get threat intelligence feeds
 * Params: type - 'feodo' | 'urlhaus' | 'cisa-kev'
 */
router.get('/threat-feeds/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['feodo', 'urlhaus', 'cisa-kev'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid feed type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Map feed type to MCP tool
    const toolMap = {
      'feodo': 'get_feodo_tracker',
      'urlhaus': 'get_urlhaus_feed',
      'cisa-kev': 'get_cisa_kev'
    };

    const response = await axios.post(`${SECURITY_PENTESTING_URL}/tools/${toolMap[type]}`, {});

    res.json({
      success: true,
      feedType: type,
      data: response.data
    });
  } catch (error) {
    console.error('[Security API] Threat feed error:', error.message);

    // Return empty feed when MCP unavailable
    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Security MCP unavailable',
        feedType: req.params.type,
        data: []
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * POST /api/security/network-scan
 * Trigger network scanning
 * Body: {
 *   target: string (IP or CIDR),
 *   scanType: 'quick' | 'full' | 'stealth',
 *   ports: string (optional, e.g., "22,80,443")
 * }
 */
router.post('/network-scan', async (req, res) => {
  try {
    const { target, scanType = 'quick', ports } = req.body;

    if (!target) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: target'
      });
    }

    const response = await axios.post(`${SECURITY_PENTESTING_URL}/tools/network_scan`, {
      target,
      scan_type: scanType,
      ports
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Security API] Network scan error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Security MCP unavailable',
        data: { status: 'unavailable' }
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * POST /api/security/vulnerability-scan
 * Trigger web vulnerability scanning
 * Body: {
 *   url: string,
 *   scanDepth: 'shallow' | 'deep',
 *   checkXSS: boolean,
 *   checkSQLi: boolean
 * }
 */
router.post('/vulnerability-scan', async (req, res) => {
  try {
    const { url, scanDepth = 'shallow', checkXSS = true, checkSQLi = true } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: url'
      });
    }

    const response = await axios.post(`${SECURITY_PENTESTING_URL}/tools/web_vuln_scan`, {
      url,
      scan_depth: scanDepth,
      check_xss: checkXSS,
      check_sqli: checkSQLi
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Security API] Vulnerability scan error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Security MCP unavailable',
        data: { vulnerabilities: [] }
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /api/security/hids/events
 * Get HIDS (Host Intrusion Detection System) events
 * Query params: limit, severity
 */
router.get('/hids/events', async (req, res) => {
  try {
    const { limit = 100, severity } = req.query;

    const response = await axios.post(`${SECURITY_PENTESTING_URL}/tools/get_hids_events`, {
      limit: parseInt(limit),
      severity
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Security API] HIDS events error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Security MCP unavailable',
        data: { events: [] }
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /api/security/reputation/ip/:ip
 * Check IP reputation
 */
router.get('/reputation/ip/:ip', async (req, res) => {
  try {
    const { ip } = req.params;

    const response = await axios.post(`${SECURITY_PENTESTING_URL}/tools/check_ip_reputation`, {
      ip
    });

    res.json({
      success: true,
      ip,
      data: response.data
    });
  } catch (error) {
    console.error('[Security API] IP reputation error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Security MCP unavailable',
        ip: req.params.ip,
        data: { reputation: 'unknown' }
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /api/security/reputation/hash/:hash
 * Check file hash reputation
 */
router.get('/reputation/hash/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    const response = await axios.post(`${SECURITY_PENTESTING_URL}/tools/check_hash_reputation`, {
      hash
    });

    res.json({
      success: true,
      hash,
      data: response.data
    });
  } catch (error) {
    console.error('[Security API] Hash reputation error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Security MCP unavailable',
        hash: req.params.hash,
        data: { reputation: 'unknown' }
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

module.exports = router;

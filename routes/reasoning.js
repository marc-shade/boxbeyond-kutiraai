/**
 * Advanced Reasoning API Routes
 * Exposes enhanced-memory MCP's reasoning capabilities:
 * - Concept blending
 * - Analogical mapping
 * - Causal chain exploration
 * - Reasoning strategy tracking
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Enhanced-memory MCP server port
const MCP_MEMORY_PORT = process.env.MCP_MEMORY_PORT || 8101;
const MCP_MEMORY_URL = `http://localhost:${MCP_MEMORY_PORT}`;

/**
 * POST /api/reasoning/blend
 * Blend two conceptual domains to generate creative combinations
 * Body: {
 *   domain1_name: string,
 *   domain1_concepts: Array<{name, properties, relations, roles}>,
 *   domain2_name: string,
 *   domain2_concepts: Array<{name, properties, relations, roles}>,
 *   strategy: 'selective' | 'inclusive' | 'emergent'
 * }
 */
router.post('/blend', async (req, res) => {
  try {
    const { domain1_name, domain1_concepts, domain2_name, domain2_concepts, strategy } = req.body;

    if (!domain1_name || !domain1_concepts || !domain2_name || !domain2_concepts) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain1_name, domain1_concepts, domain2_name, domain2_concepts'
      });
    }

    // Call enhanced-memory MCP concept blending tool
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/blend_concepts_tool`, {
      domain1_name,
      domain1_concepts,
      domain2_name,
      domain2_concepts,
      strategy: strategy || 'selective'
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Reasoning API] Blend error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * POST /api/reasoning/analogy
 * Find analogical mapping between domains (A:B::C:D)
 * Body: {
 *   source_domain: string,
 *   source_concept: string,
 *   target_domain: string
 * }
 */
router.post('/analogy', async (req, res) => {
  try {
    const { source_domain, source_concept, target_domain } = req.body;

    if (!source_domain || !source_concept || !target_domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: source_domain, source_concept, target_domain'
      });
    }

    // Call enhanced-memory MCP analogy finding tool
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/find_analogy_tool`, {
      source_domain,
      source_concept,
      target_domain
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Reasoning API] Analogy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /api/reasoning/causal-chains/:entityId
 * Get causal chain from an entity
 * Query params: direction (forward/backward), depth, minStrength
 */
router.get('/causal-chains/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    const { direction = 'forward', depth = 5, minStrength = 0.3 } = req.query;

    // Call enhanced-memory MCP causal chain tool
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/get_causal_chain`, {
      entity_id: parseInt(entityId),
      direction,
      depth: parseInt(depth),
      min_strength: parseFloat(minStrength)
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Reasoning API] Causal chain error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * POST /api/reasoning/predict-outcome
 * Predict likely outcomes of an action based on causal history
 * Body: {
 *   action_entity_id: number,
 *   context: object (optional)
 * }
 */
router.post('/predict-outcome', async (req, res) => {
  try {
    const { action_entity_id, context } = req.body;

    if (!action_entity_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: action_entity_id'
      });
    }

    // Call enhanced-memory MCP prediction tool
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/predict_outcome`, {
      action_entity_id,
      context
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Reasoning API] Predict outcome error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /api/reasoning/strategies
 * Get effective reasoning strategies
 * Query params: minSuccessRate, minUsage
 */
router.get('/strategies', async (req, res) => {
  try {
    const { minSuccessRate = 0.6, minUsage = 3 } = req.query;

    // Call enhanced-memory MCP reasoning strategy tool
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/get_effective_reasoning_strategies`, {
      agent_id: 'kutiraai-dashboard',
      min_success_rate: parseFloat(minSuccessRate),
      min_usage: parseInt(minUsage)
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Reasoning API] Strategies error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * POST /api/reasoning/track-strategy
 * Track usage and effectiveness of a reasoning strategy
 * Body: {
 *   strategy_name: string,
 *   strategy_type: 'deductive' | 'inductive' | 'abductive' | 'analogical',
 *   success: boolean,
 *   confidence: number (0-1),
 *   context: object (optional)
 * }
 */
router.post('/track-strategy', async (req, res) => {
  try {
    const { strategy_name, strategy_type, success, confidence, context } = req.body;

    if (!strategy_name || !strategy_type || success === undefined || confidence === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: strategy_name, strategy_type, success, confidence'
      });
    }

    // Call enhanced-memory MCP strategy tracking tool
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/track_reasoning_strategy`, {
      agent_id: 'kutiraai-dashboard',
      strategy_name,
      strategy_type,
      success,
      confidence,
      context
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Reasoning API] Track strategy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /api/reasoning/blend-history
 * Get history of concept blends
 * Query params: limit
 */
router.get('/blend-history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Call enhanced-memory MCP blend history tool
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/blend_history_tool`, {
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Reasoning API] Blend history error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /api/reasoning/status
 * Get reasoning system status
 */
router.get('/status', async (req, res) => {
  try {
    // Call enhanced-memory MCP status tool
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/blend_status_tool`, {});

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Reasoning API] Status error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

module.exports = router;

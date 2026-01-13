/**
 * Visual API Routes
 * Exposes visual processing capabilities:
 * - TPU status and health
 * - Visual episode storage and retrieval
 * - Visual similarity search
 * - Image classification
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Enhanced-memory MCP server port (visual memory)
const MCP_MEMORY_PORT = process.env.MCP_MEMORY_PORT || 8101;
const MCP_MEMORY_URL = `http://localhost:${MCP_MEMORY_PORT}`;

// Coral TPU MCP server port
const TPU_MCP_PORT = process.env.TPU_MCP_PORT || 8105;
const TPU_MCP_URL = `http://localhost:${TPU_MCP_PORT}`;

/**
 * GET /api/visual/tpu-status
 * Get TPU status and inference statistics
 */
router.get('/tpu-status', async (req, res) => {
  try {
    const response = await axios.post(`${TPU_MCP_URL}/tools/tpu_status`, {});

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Visual API] TPU status error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'TPU MCP unavailable',
        data: {
          available: false,
          status: 'offline'
        }
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
 * GET /api/visual/episodes
 * Get visual episodes from memory
 * Query params: hours (default: 24), limit (default: 50)
 */
router.get('/episodes', async (req, res) => {
  try {
    const { hours = 24, limit = 50 } = req.query;

    const response = await axios.post(`${MCP_MEMORY_URL}/tools/get_recent_visual_episodes`, {
      hours: parseInt(hours),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Visual API] Get episodes error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Enhanced-memory MCP unavailable',
        data: { episodes: [] }
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
 * POST /api/visual/search
 * Visual similarity search
 * Body: {
 *   text_query: string (optional),
 *   image_path: string (optional),
 *   k: number (default: 10),
 *   text_weight: number (default: 0.5),
 *   visual_weight: number (default: 0.5)
 * }
 */
router.post('/search', async (req, res) => {
  try {
    const {
      text_query = '',
      image_path = '',
      k = 10,
      text_weight = 0.5,
      visual_weight = 0.5
    } = req.body;

    if (!text_query && !image_path) {
      return res.status(400).json({
        success: false,
        error: 'Must provide either text_query or image_path'
      });
    }

    const response = await axios.post(`${MCP_MEMORY_URL}/tools/multimodal_visual_search`, {
      text_query,
      image_path,
      k: parseInt(k),
      text_weight: parseFloat(text_weight),
      visual_weight: parseFloat(visual_weight)
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Visual API] Visual search error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Enhanced-memory MCP unavailable',
        data: { results: [] }
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
 * POST /api/visual/classify
 * Classify an image using TPU
 * Body: {
 *   image_path: string,
 *   model: 'mobilenet_v2' | 'efficientnet_s' (default: mobilenet_v2),
 *   top_k: number (default: 5)
 * }
 */
router.post('/classify', async (req, res) => {
  try {
    const { image_path, model = 'mobilenet_v2', top_k = 5 } = req.body;

    if (!image_path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: image_path'
      });
    }

    const response = await axios.post(`${TPU_MCP_URL}/tools/classify_image`, {
      image_path,
      model,
      top_k: parseInt(top_k)
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Visual API] Classify error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'TPU MCP unavailable',
        data: { predictions: [] }
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
 * GET /api/visual/stats
 * Get visual memory statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/get_visual_memory_stats`, {});

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[Visual API] Stats error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Enhanced-memory MCP unavailable',
        data: {
          total_episodes: 0,
          embedding_coverage: 0
        }
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
 * GET /api/visual/clusters
 * Get visual memory clustering information
 */
router.get('/clusters', async (req, res) => {
  try {
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/get_visual_memory_stats`, {});

    if (!response.data) {
      return res.json({
        success: false,
        error: 'No cluster data available',
        cluster_count: 0,
        clusters: []
      });
    }

    // Extract cluster information from stats
    const clusterCount = response.data.cluster_count || 0;
    const totalEpisodes = response.data.total_episodes || 0;

    res.json({
      success: true,
      cluster_count: clusterCount,
      total_episodes: totalEpisodes,
      clusters: [], // Placeholder - real implementation would fetch actual cluster data
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Visual API] Clusters error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Enhanced-memory MCP unavailable',
        cluster_count: 0,
        clusters: []
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
 * GET /api/visual/image/:episodeId
 * Serve image file for a visual episode
 */
router.get('/image/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;

    // Get episode details
    const response = await axios.post(`${MCP_MEMORY_URL}/tools/get_recent_visual_episodes`, {
      hours: 168, // 1 week
      limit: 1000
    });

    if (!response.data?.episodes) {
      return res.status(404).json({
        success: false,
        error: 'No episodes found'
      });
    }

    const episode = response.data.episodes.find(ep => ep.episode_id === parseInt(episodeId));

    if (!episode || !episode.image_path) {
      return res.status(404).json({
        success: false,
        error: 'Episode or image not found'
      });
    }

    // Serve the image file
    res.sendFile(episode.image_path);
  } catch (error) {
    console.error('[Visual API] Image serve error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Enhanced-memory MCP unavailable'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

/**
 * Research API Routes
 * Exposes research paper MCP capabilities:
 * - Paper search and retrieval
 * - Citation network analysis
 * - Recent papers by topic
 * - Knowledge synthesis
 * - AI-powered research suggestions
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Research MCP server port
const RESEARCH_PORT = process.env.RESEARCH_MCP_PORT || 8104;
const RESEARCH_URL = `http://localhost:${RESEARCH_PORT}`;

/**
 * POST /api/research/search
 * Search for research papers
 * Body: {
 *   query: string,
 *   limit: number (optional),
 *   year_from: number (optional),
 *   year_to: number (optional),
 *   fields: string[] (optional)
 * }
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 20, year_from, year_to, fields } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: query'
      });
    }

    const response = await axios.post(`${RESEARCH_URL}/tools/search_papers`, {
      query,
      limit,
      year_from,
      year_to,
      fields
    });

    res.json({
      success: true,
      query,
      data: response.data
    });
  } catch (error) {
    console.error('[Research API] Search error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Research MCP unavailable',
        query: req.body.query,
        data: { papers: [] }
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
 * GET /api/research/citations/:paperId
 * Get citation network for a paper
 * Query params: depth (default: 2)
 */
router.get('/citations/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;
    const { depth = 2 } = req.query;

    const response = await axios.post(`${RESEARCH_URL}/tools/get_citations`, {
      paper_id: paperId,
      depth: parseInt(depth)
    });

    res.json({
      success: true,
      paperId,
      data: response.data
    });
  } catch (error) {
    console.error('[Research API] Citations error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Research MCP unavailable',
        paperId: req.params.paperId,
        data: { citations: [], references: [] }
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
 * GET /api/research/recent
 * Get recent papers by topic (from Research MCP) or from overnight sessions
 * Query params: topic (optional), days (default: 30), limit (default: 20)
 * If topic is not provided, returns papers from overnight automation sessions
 */
router.get('/recent', async (req, res) => {
  try {
    const { topic, days = 30, limit = 20 } = req.query;

    // If no topic provided, return papers from overnight sessions
    if (!topic) {
      const path = require('path');
      const fs = require('fs').promises;
      const sessionsDir = path.join(__dirname, '../data/overnight/sessions');
      let recentPapers = [];

      try {
        const files = await fs.readdir(sessionsDir);
        const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));

        // Sort by modification time (newest first)
        const fileStats = await Promise.all(
          sessionFiles.map(async (f) => {
            const stat = await fs.stat(path.join(sessionsDir, f));
            return { file: f, mtime: stat.mtime };
          })
        );
        fileStats.sort((a, b) => b.mtime - a.mtime);

        // Read from recent sessions
        for (const { file } of fileStats.slice(0, 5)) {
          try {
            const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
            const session = JSON.parse(content);
            if (session.discoveries?.papers) {
              recentPapers.push(...session.discoveries.papers.map(p => ({
                ...p,
                sessionId: session.sessionId,
                discoveredAt: session.startTime
              })));
            }
          } catch (e) {
            // Skip invalid session files
          }
        }

        // Return most recent, limited
        recentPapers = recentPapers.slice(0, parseInt(limit));
      } catch (e) {
        // Sessions dir doesn't exist yet - return empty
      }

      return res.json({
        success: true,
        source: 'overnight_sessions',
        data: recentPapers
      });
    }

    // Topic provided - use Research MCP
    const response = await axios.post(`${RESEARCH_URL}/tools/get_recent_papers`, {
      topic,
      days: parseInt(days),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      topic,
      source: 'research_mcp',
      data: response.data
    });
  } catch (error) {
    console.error('[Research API] Recent papers error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Research MCP unavailable',
        topic: req.query.topic,
        data: { papers: [] }
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
 * GET /api/research/synthesis
 * Get knowledge synthesis across multiple papers (from Research MCP) or overnight sessions
 * Query params: topic (optional), limit (default: 10)
 * If topic is not provided, synthesizes from overnight session discoveries
 */
router.get('/synthesis', async (req, res) => {
  try {
    const { topic, limit = 10 } = req.query;

    // If no topic provided, synthesize from overnight sessions
    if (!topic) {
      const path = require('path');
      const fs = require('fs').promises;
      const sessionsDir = path.join(__dirname, '../data/overnight/sessions');
      let techniques = [];
      let insights = [];
      let trends = { emerging: [], declining: [], stable: [] };

      try {
        const files = await fs.readdir(sessionsDir);
        const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));

        // Process recent sessions
        for (const file of sessionFiles.slice(0, 10)) {
          try {
            const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
            const session = JSON.parse(content);

            // Extract techniques from discoveries
            if (session.discoveries?.papers) {
              for (const paper of session.discoveries.papers) {
                if (paper.abstract) {
                  // Extract key techniques mentioned
                  const techMatches = paper.abstract.match(/(?:using|via|through|with)\s+([A-Za-z\s-]+(?:network|model|algorithm|method|architecture|framework))/gi) || [];
                  techniques.push(...techMatches.slice(0, 3));
                }
                if (paper.title) {
                  insights.push({
                    title: paper.title,
                    source: paper.source || 'arxiv',
                    relevance: paper.relevanceScore || 0.5
                  });
                }
              }
            }

            // Extract any stored insights
            if (session.synthesis?.insights) {
              insights.push(...session.synthesis.insights);
            }
          } catch (e) {
            // Skip invalid files
          }
        }

        // Dedupe and limit
        techniques = [...new Set(techniques)].slice(0, parseInt(limit));
        insights = insights.slice(0, parseInt(limit));

        // Infer trends from paper topics
        const topicCounts = {};
        insights.forEach(i => {
          const words = (i.title || '').toLowerCase().split(/\s+/);
          words.forEach(w => {
            if (w.length > 4) topicCounts[w] = (topicCounts[w] || 0) + 1;
          });
        });

        const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
        trends.emerging = sorted.slice(0, 5).map(([term]) => term);
      } catch (e) {
        // Sessions dir doesn't exist yet
      }

      return res.json({
        success: true,
        source: 'overnight_sessions',
        data: { techniques, insights, trends }
      });
    }

    // Topic provided - use Research MCP
    const response = await axios.post(`${RESEARCH_URL}/tools/synthesize_knowledge`, {
      topic,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      topic,
      source: 'research_mcp',
      data: response.data
    });
  } catch (error) {
    console.error('[Research API] Synthesis error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Research MCP unavailable',
        topic: req.query.topic,
        data: { synthesis: null, papers: [] }
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
 * GET /api/research/discover
 * Get AI-powered research suggestions (from Research MCP) or overnight discoveries
 * Query params: interests (comma-separated, optional), limit (default: 5)
 * If interests not provided, discovers papers from overnight sessions using relevance scoring
 */
router.get('/discover', async (req, res) => {
  try {
    const { interests, limit = 5 } = req.query;

    // If no interests provided, discover from overnight sessions with relevance scoring
    if (!interests) {
      const path = require('path');
      const fs = require('fs').promises;
      const sessionsDir = path.join(__dirname, '../data/overnight/sessions');
      let discoveredPapers = [];

      // Default interests for agentic AI system
      const defaultInterests = ['mcp', 'agent', 'workflow', 'memory', 'rag', 'llm', 'autonomous'];

      try {
        const files = await fs.readdir(sessionsDir);
        const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));

        for (const file of sessionFiles.slice(0, 5)) {
          try {
            const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
            const session = JSON.parse(content);

            if (session.discoveries?.papers) {
              for (const paper of session.discoveries.papers) {
                // Score by relevance to default interests
                const titleLower = (paper.title || '').toLowerCase();
                const abstractLower = (paper.abstract || '').toLowerCase();
                let relevanceScore = 0;

                for (const interest of defaultInterests) {
                  if (titleLower.includes(interest)) relevanceScore += 2;
                  if (abstractLower.includes(interest)) relevanceScore += 1;
                }

                if (relevanceScore > 0) {
                  discoveredPapers.push({
                    ...paper,
                    relevanceScore,
                    matchedInterests: defaultInterests.filter(i =>
                      titleLower.includes(i) || abstractLower.includes(i)
                    ),
                    sessionId: session.sessionId,
                    discoveredAt: session.startTime
                  });
                }
              }
            }
          } catch (e) {
            // Skip invalid files
          }
        }

        // Sort by relevance and limit
        discoveredPapers.sort((a, b) => b.relevanceScore - a.relevanceScore);
        discoveredPapers = discoveredPapers.slice(0, parseInt(limit));
      } catch (e) {
        // Sessions dir doesn't exist yet
      }

      return res.json({
        success: true,
        source: 'overnight_sessions',
        interests: defaultInterests,
        data: discoveredPapers
      });
    }

    // Interests provided - use Research MCP
    const interestList = interests.split(',').map(i => i.trim());

    const response = await axios.post(`${RESEARCH_URL}/tools/discover_papers`, {
      interests: interestList,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      interests: interestList,
      source: 'research_mcp',
      data: response.data
    });
  } catch (error) {
    console.error('[Research API] Discover error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: false,
        error: 'Research MCP unavailable',
        interests: req.query.interests?.split(','),
        data: { suggestions: [] }
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
 * GET /api/research/download/:paperId
 * Download a paper PDF (proxy to arXiv or other sources)
 */
router.get('/download/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;

    // Try to get paper details first
    const response = await axios.post(`${RESEARCH_URL}/tools/get_paper_details`, {
      paper_id: paperId
    });

    if (response.data?.pdf_url) {
      // Proxy the PDF download
      const pdfResponse = await axios.get(response.data.pdf_url, {
        responseType: 'stream'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${paperId}.pdf"`);
      pdfResponse.data.pipe(res);
    } else {
      // If no PDF URL, return the paper details as JSON
      res.json({
        success: true,
        paperId,
        data: response.data,
        message: 'PDF not available, returning paper details'
      });
    }
  } catch (error) {
    console.error('[Research API] Download error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Research MCP unavailable',
        paperId: req.params.paperId
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
 * POST /api/research/save
 * Save a paper to the local research library (enhanced memory)
 * Body: {
 *   paperId: string,
 *   title: string,
 *   authors: string[],
 *   abstract: string,
 *   url: string,
 *   tags: string[] (optional),
 *   notes: string (optional)
 * }
 */
router.post('/save', async (req, res) => {
  try {
    const { paperId, title, authors, abstract, url, tags = [], notes = '' } = req.body;

    if (!paperId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: paperId, title'
      });
    }

    // Store in enhanced memory as a research entity
    const MCP_MEMORY_URL = `http://localhost:${process.env.MCP_MEMORY_PORT || 8101}`;

    const response = await axios.post(`${MCP_MEMORY_URL}/tools/create_entities`, {
      entities: [{
        name: `research_paper_${paperId}`,
        entityType: 'research_paper',
        observations: [
          `Title: ${title}`,
          `Authors: ${Array.isArray(authors) ? authors.join(', ') : authors}`,
          `Abstract: ${abstract || 'No abstract available'}`,
          `URL: ${url || 'N/A'}`,
          `Tags: ${tags.join(', ') || 'none'}`,
          `Notes: ${notes || 'No notes'}`,
          `Saved: ${new Date().toISOString()}`
        ]
      }]
    });

    res.json({
      success: true,
      paperId,
      message: 'Paper saved to research library',
      data: response.data
    });
  } catch (error) {
    console.error('[Research API] Save error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Memory MCP unavailable',
        paperId: req.body.paperId
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

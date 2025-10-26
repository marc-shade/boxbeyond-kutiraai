const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const cors = require('cors');
const { getOrchestratorService } = require('./src/services/orchestrator-service');

const app = express();
const execAsync = promisify(exec);
const PORT = process.env.PORT || 3002;

// Lazy-load orchestrator service (only initialize when needed)
let orchestratorService = null;

function getOrchestrator() {
  if (!orchestratorService) {
    orchestratorService = getOrchestratorService();
  }
  return orchestratorService;
}

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3101'],
  credentials: true
}));

app.use(express.json());

// MCP server configurations
const servers = {
  'claude-flow': {
    path: '/Users/marc/Documents/Cline/MCP/claude-flow-mcp',
    command: 'node server.js',
    port: null,
    tools: ['swarm_init', 'agent_spawn', 'swarm_status', 'memory_usage', 'bottleneck_analyze']
  },
  'enhanced-memory': {
    path: '/Users/marc/Documents/Cline/MCP/enhanced-memory-mcp',
    command: 'node server.js',
    port: null,
    tools: ['create_entities', 'search_nodes', 'get_memory_status', 'read_graph', 'create_relations']
  },
  'voice-mode': {
    path: '/Users/marc/Documents/Cline/MCP/voice-mode',
    command: 'python3 server.py',
    port: 2022,
    tools: ['converse', 'voice_status', 'service', 'list_tts_voices', 'voice_registry']
  },
  'ai-persona-lab': {
    path: '/Users/marc/Documents/Cline/MCP/ai-persona-lab-mcp',
    command: 'python3 server.py',
    port: 9201,
    tools: ['create_persona', 'list_personas', 'create_experiment', 'run_experiment', 'analyze_experiment']
  },
  'task-manager': {
    path: '/Users/marc/Documents/Cline/MCP/task-manager-mcp',
    command: 'node server.js',
    port: null,
    tools: ['create_task', 'prioritize_tasks', 'generate_sprint_plan', 'identify_bottlenecks']
  },
  'confidence-orchestrator': {
    path: '/Users/marc/Documents/Cline/MCP/confidence-orchestrator-mcp',
    command: 'node server.js',
    port: null,
    tools: ['evaluate_confidence', 'route_agent', 'evaluate_swarm_confidence', 'check_early_termination']
  }
};

// Check if an MCP server is running
async function checkServerStatus(serverName) {
  const server = servers[serverName];
  if (!server) return { status: 'unknown', error: 'Server not found' };

  try {
    // Check if process is running
    const { stdout } = await execAsync(`ps aux | grep "${server.command}" | grep -v grep | wc -l`);
    const processCount = parseInt(stdout.trim());
    
    // If server has a port, check if it's listening
    if (server.port) {
      const { stdout: portCheck } = await execAsync(`lsof -i :${server.port} | grep LISTEN | wc -l`).catch(() => ({ stdout: '0' }));
      const portListening = parseInt(portCheck.trim()) > 0;
      
      return {
        status: portListening ? 'active' : processCount > 0 ? 'starting' : 'inactive',
        processCount,
        port: server.port,
        tools: server.tools.length
      };
    }
    
    return {
      status: processCount > 0 ? 'active' : 'inactive',
      processCount,
      tools: server.tools.length
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      tools: server.tools.length
    };
  }
}

// API Routes

// Get all server status
app.get('/api/mcp/servers', async (req, res) => {
  try {
    const statuses = {};
    let totalActive = 0;
    
    for (const serverName of Object.keys(servers)) {
      const status = await checkServerStatus(serverName);
      statuses[serverName] = status;
      if (status.status === 'active') totalActive++;
    }
    
    res.json({
      servers: statuses,
      totalActive,
      totalAvailable: Object.keys(servers).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start a server
app.post('/api/mcp/servers/:name/start', async (req, res) => {
  const serverName = req.params.name;
  const server = servers[serverName];
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  try {
    // Change to server directory and start it
    const command = `cd ${server.path} && ${server.command} > /tmp/${serverName}.log 2>&1 &`;
    await execAsync(command);
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if it started successfully
    const status = await checkServerStatus(serverName);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: `Failed to start ${serverName}: ${error.message}` });
  }
});

// Get memory usage
app.get('/api/mcp/memory', async (req, res) => {
  try {
    // Get Node.js processes memory usage
    const { stdout } = await execAsync("ps aux | grep node | awk '{sum+=$6} END {print sum/1024}'");
    const nodeMemoryMB = parseFloat(stdout.trim()) || 0;
    
    // Get Python processes memory usage
    const { stdout: pythonOut } = await execAsync("ps aux | grep python | awk '{sum+=$6} END {print sum/1024}'");
    const pythonMemoryMB = parseFloat(pythonOut.trim()) || 0;
    
    res.json({
      total: Math.round(nodeMemoryMB + pythonMemoryMB),
      node: Math.round(nodeMemoryMB),
      python: Math.round(pythonMemoryMB),
      limit: 6144 // 6GB limit
    });
  } catch (error) {
    res.json({ total: 0, node: 0, python: 0, limit: 6144 });
  }
});

// Stop a server
app.post('/api/mcp/servers/:name/stop', async (req, res) => {
  const serverName = req.params.name;
  const server = servers[serverName];
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  try {
    // Find and kill the process
    const { stdout } = await execAsync(`ps aux | grep "${server.command}" | grep -v grep | awk '{print $2}'`);
    const pids = stdout.trim().split('\n').filter(pid => pid);
    
    for (const pid of pids) {
      await execAsync(`kill ${pid}`);
    }
    
    res.json({ status: 'stopped', serverName });
  } catch (error) {
    res.status(500).json({ error: `Failed to stop ${serverName}: ${error.message}` });
  }
});

// Get MCP process count
app.get('/api/mcp/processes', async (req, res) => {
  try {
    const { stdout } = await execAsync('ps aux | grep -E "(mcp|MCP)" | grep -v grep | wc -l');
    res.json({ count: parseInt(stdout.trim()) });
  } catch (error) {
    res.json({ count: 0 });
  }
});

// Enhanced MCP health monitoring endpoints (using mcp-health-checker.py)
const healthCheckerPath = '/Volumes/FILES/code/kutiraai/services/mcp-health-checker.py';

// Get detailed health for all services
app.get('/api/mcp/health', async (req, res) => {
  try {
    const { stdout } = await execAsync(`python3 ${healthCheckerPath} check-all --json`);
    const healthData = JSON.parse(stdout);
    res.json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Failed to check MCP health',
      details: error.message
    });
  }
});

// Get detailed health for a specific service
app.get('/api/mcp/health/:service', async (req, res) => {
  const serviceName = req.params.service;

  try {
    const { stdout } = await execAsync(`python3 ${healthCheckerPath} check --service ${serviceName} --json`);
    const healthData = JSON.parse(stdout);
    res.json(healthData);
  } catch (error) {
    console.error(`Health check error for ${serviceName}:`, error);
    res.status(500).json({
      error: `Failed to check health for ${serviceName}`,
      details: error.message
    });
  }
});

// Get restart information for a service
app.get('/api/mcp/restart-info/:service', async (req, res) => {
  const serviceName = req.params.service;

  try {
    const { stdout } = await execAsync(`python3 ${healthCheckerPath} restart-info --service ${serviceName} --json`);
    const restartInfo = JSON.parse(stdout);
    res.json(restartInfo);
  } catch (error) {
    console.error(`Restart info error for ${serviceName}:`, error);
    res.status(500).json({
      error: `Failed to get restart info for ${serviceName}`,
      details: error.message
    });
  }
});

// Launch Flow Nexus
app.post('/api/flow-nexus/launch', async (req, res) => {
  const { mode = '' } = req.body;
  
  try {
    const flowNexusPath = '/Users/marc/Documents/Cline/flow-nexus-agentic-system';
    const command = `cd ${flowNexusPath} && ./launch.sh ${mode}`;
    await execAsync(`open -a Terminal "${command}"`);
    res.json({ success: true, mode });
  } catch (error) {
    res.status(500).json({ error: `Failed to launch Flow Nexus: ${error.message}` });
  }
});

// Create agent swarm
app.post('/api/swarm/create', async (req, res) => {
  const { swarmType, task } = req.body;
  
  const swarmConfigs = {
    research: {
      agents: ['Swarm Researcher', 'Swarm Analyst', 'Academic Paper Researcher'],
      tools: ['WebSearch', 'WebFetch', 'Grep', 'Read']
    },
    development: {
      agents: ['Swarm Coder', 'Backend Engineer', 'Frontend Specialist', 'Swarm Tester'],
      tools: ['Write', 'Edit', 'MultiEdit', 'Bash', 'Task']
    },
    creative: {
      agents: ['Image Generator', 'Landing Page Specialist', 'UI Generator Agent'],
      tools: ['mcp__mcp-image-gen__smart_generate_image', 'mcp__imagemagick-local__imagemagick']
    },
    quality: {
      agents: ['Swarm Tester', 'Swarm Reviewer', 'Security Specialist'],
      tools: ['Grep', 'Read', 'Task', 'mcp__quality-assurance-mcp__run_tests']
    }
  };

  const config = swarmConfigs[swarmType];
  if (!config) {
    return res.status(400).json({ error: 'Unknown swarm type' });
  }

  try {
    // This would integrate with actual swarm orchestration system
    const swarmId = `swarm_${swarmType}_${Date.now()}`;
    
    res.json({
      swarmId,
      swarmType,
      task: task || `${swarmType} swarm deployment`,
      agents: config.agents,
      tools: config.tools,
      status: 'initialized',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to create ${swarmType} swarm: ${error.message}` });
  }
});

// Get agents by category
app.get('/api/agents/:category', async (req, res) => {
  const { category } = req.params;
  
  const agentCategories = {
    'Core System': [
      { name: 'Agent Builder', description: 'Agent creation and configuration with POML integration' },
      { name: 'Self Admin', description: 'Claude Code system administration and optimization' },
      { name: 'Swarm Queen', description: 'Master orchestrator for complex coordination' },
      { name: 'AIME Coordinator', description: 'Advanced AI Mission Execution with agent directory awareness' },
      { name: 'Swarm Coordinator', description: 'Multi-agent orchestration specialist' },
      { name: 'Swarm Monitor', description: 'System monitoring and observability' },
      { name: 'Daemon Manager', description: 'Process and service management' }
    ],
    'Implementation': [
      { name: 'Swarm Coder', description: 'General code implementation specialist' },
      { name: 'Frontend Specialist', description: 'UI/UX and frontend development' },
      { name: 'Backend Engineer', description: 'Server-side and API development' },
      { name: 'System Architect', description: 'Architecture and system design' },
      { name: 'Mobile UI Implementer', description: 'iOS/Android UI specialist' },
      { name: 'MCP Builder', description: 'MCP server development specialist' }
    ],
    'Quality & Security': [
      { name: 'Security Specialist', description: 'Security and compliance' },
      { name: 'Swarm Guardian', description: 'Security reviews and standards' },
      { name: 'Swarm Tester', description: 'Testing and quality assurance' },
      { name: 'Swarm Reviewer', description: 'Code review and quality' },
      { name: 'Reverse Engineer', description: 'Legacy code analysis and system reconstruction' }
    ]
  };

  const agents = agentCategories[category] || [];
  res.json({ category, agents });
});

// Spawn individual agent
app.post('/api/agent/spawn', async (req, res) => {
  const { agentName, task, category } = req.body;
  
  try {
    // This would integrate with actual agent spawning system
    const agentId = `agent_${agentName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    
    res.json({
      agentId,
      agentName,
      task: task || `${agentName} agent deployment`,
      category,
      status: 'spawned',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to spawn ${agentName}: ${error.message}` });
  }
});

// ===== ORCHESTRATOR API ROUTES =====

// Get orchestrator status
app.get('/api/orchestrator/status', async (req, res) => {
  try {
    const status = await getOrchestrator().getStatus();
    res.json({ status });
  } catch (error) {
    console.error('[API] Orchestrator status error:', error);
    res.status(503).json({
      error: 'Orchestrator service unavailable',
      message: 'Make sure AI orchestrator is running: node ai-orchestrator-agent.js'
    });
  }
});

// Get all monitored services
app.get('/api/orchestrator/services', async (req, res) => {
  try {
    const services = await getOrchestrator().getServices();
    res.json({ services });
  } catch (error) {
    console.error('[API] Orchestrator services error:', error);
    res.status(503).json({
      error: 'Orchestrator service unavailable',
      message: 'Make sure AI orchestrator is running: node ai-orchestrator-agent.js'
    });
  }
});

// Get recovery history
app.get('/api/orchestrator/recoveries', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const recoveries = await getOrchestrator().getRecoveryHistory(limit);
    res.json({ recoveries });
  } catch (error) {
    console.error('[API] Orchestrator recoveries error:', error);
    res.status(503).json({
      error: 'Orchestrator service unavailable',
      message: 'Make sure AI orchestrator is running: node ai-orchestrator-agent.js'
    });
  }
});

// Get learning insights
app.get('/api/orchestrator/learnings', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const learnings = await getOrchestrator().getLearnings(limit);
    res.json({ learnings });
  } catch (error) {
    console.error('[API] Orchestrator learnings error:', error);
    res.status(503).json({
      error: 'Orchestrator service unavailable',
      message: 'Make sure AI orchestrator is running: node ai-orchestrator-agent.js'
    });
  }
});

// Get performance metrics
app.get('/api/orchestrator/metrics', async (req, res) => {
  try {
    const metrics = await getOrchestrator().getMetrics();
    res.json({ metrics });
  } catch (error) {
    console.error('[API] Orchestrator metrics error:', error);
    res.status(503).json({
      error: 'Orchestrator service unavailable',
      message: 'Make sure AI orchestrator is running: node ai-orchestrator-agent.js'
    });
  }
});

// Force recovery for a service
app.post('/api/orchestrator/force-recovery', async (req, res) => {
  try {
    const { serviceKey } = req.body;
    if (!serviceKey) {
      return res.status(400).json({ error: 'serviceKey is required' });
    }

    const result = await getOrchestrator().forceRecovery(serviceKey);
    res.json({ success: true, result });
  } catch (error) {
    console.error('[API] Orchestrator force-recovery error:', error);
    res.status(503).json({
      error: 'Orchestrator service unavailable',
      message: 'Make sure AI orchestrator is running: node ai-orchestrator-agent.js'
    });
  }
});

// ===== TEMPORAL WORKFLOW API ROUTES =====

// Get Temporal Infrastructure Health status
app.get('/api/temporal/health', async (req, res) => {
  try {
    const healthFilePath = '/Volumes/FILES/agentic-system/temporal-workflows/health_results.json';
    const healthData = await fs.readFile(healthFilePath, 'utf-8');
    const results = JSON.parse(healthData);

    // Return the latest health check result
    const latest = results[results.length - 1] || {};

    res.json({
      success: true,
      health: latest,
      total_checks: results.length
    });
  } catch (error) {
    // If file doesn't exist yet, return empty state
    if (error.code === 'ENOENT') {
      return res.json({
        success: true,
        health: {
          results: [],
          message: 'No health checks performed yet'
        },
        total_checks: 0
      });
    }

    console.error('[API] Temporal health error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Temporal voice notifications
app.get('/api/temporal/notifications', async (req, res) => {
  try {
    const notificationPath = '/Volumes/FILES/agentic-system/temporal-workflows/voice_notifications.log';
    const logData = await fs.readFile(notificationPath, 'utf-8');
    const notifications = logData
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^(.+?) - (.+)$/);
        return match ? {
          timestamp: match[1],
          message: match[2]
        } : {
          timestamp: new Date().toISOString(),
          message: line
        };
      });

    res.json({
      success: true,
      notifications: notifications.reverse(), // Latest first
      total: notifications.length
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.json({
        success: true,
        notifications: [],
        total: 0
      });
    }

    console.error('[API] Temporal notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Temporal workflow status
app.get('/api/temporal/status', async (req, res) => {
  try {
    // Check if Temporal server is running
    const { stdout: temporalPid } = await execAsync('cat /Volumes/FILES/temporal-db/temporal.pid 2>/dev/null || echo ""');
    const isTemporalRunning = temporalPid.trim() !== '';

    // Check if worker is running
    const { stdout: workerPid } = await execAsync('cat /Volumes/FILES/agentic-system/temporal-workflows/health_worker.pid 2>/dev/null || echo ""');
    const isWorkerRunning = workerPid.trim() !== '';

    // Get latest health check
    try {
      const healthFilePath = '/Volumes/FILES/agentic-system/temporal-workflows/health_results.json';
      const healthData = await fs.readFile(healthFilePath, 'utf-8');
      const results = JSON.parse(healthData);
      const latest = results[results.length - 1] || {};

      res.json({
        success: true,
        temporal_running: isTemporalRunning,
        worker_running: isWorkerRunning,
        latest_health: latest,
        total_checks: results.length
      });
    } catch {
      res.json({
        success: true,
        temporal_running: isTemporalRunning,
        worker_running: isWorkerRunning,
        latest_health: null,
        total_checks: 0
      });
    }
  } catch (error) {
    console.error('[API] Temporal status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== CSRF TOKEN ENDPOINT =====
app.get('/api/csrf-token', (req, res) => {
  res.json({ token: 'development-token-' + Date.now() });
});

// ===== NOTIFICATIONS STREAM ENDPOINT =====
app.get('/api/notifications/stream', (req, res) => {
  res.json({ notifications: [] });
});

// ===== PORT DISCOVERY ENDPOINTS =====
app.get('/api/port-discovery/urls', (req, res) => {
  res.json({ urls: {} });
});

app.get('/api/port-discovery/health', (req, res) => {
  res.json({ health: 'ok', services: [] });
});

// ===== MCP SERVICES ENDPOINT =====
app.get('/api/mcp/services', (req, res) => {
  res.json({ services: [] });
});

// ===== DASHBOARD STATS ENDPOINT =====
app.get('/api/dashboard/stats', (req, res) => {
  res.json({ stats: {} });
});

// ===== OVERNIGHT AUTOMATION ENDPOINTS =====
// Helper functions to read intelligence data from /tmp/
const readJsonFile = (filename) => {
  try {
    const filePath = path.join('/tmp', filename);
    if (fsSync.existsSync(filePath)) {
      const data = fsSync.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
};

const readJsonlFile = (filename, limit = 10) => {
  try {
    const filePath = path.join('/tmp', filename);
    if (fsSync.existsSync(filePath)) {
      const data = fsSync.readFileSync(filePath, 'utf8');
      const lines = data.trim().split('\n').filter(line => line.length > 0);
      return lines.slice(-limit).map(line => JSON.parse(line));
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

app.get('/api/overnight/latest-report', (req, res) => {
  const metrics = readJsonFile('claude_performance_metrics.json');
  const patterns = readJsonFile('claude_pattern_analysis.json');
  const costs = readJsonFile('claude_cost_analysis.json');
  const optimizations = readJsonFile('claude_optimizations_applied.json');
  const alerts = readJsonFile('claude_maintenance_alerts.json');
  const learnings = readJsonlFile('claude_learning_memory.jsonl', 5);

  if (!metrics && !patterns && !costs) {
    return res.status(404).json({
      success: false,
      error: 'No intelligence data available yet. Workers may still be initializing.'
    });
  }

  res.json({
    success: true,
    report: {
      timestamp: new Date().toISOString(),
      metrics: metrics || { error: 'Metrics not available' },
      patterns: patterns || { error: 'Patterns not available' },
      costs: costs || { error: 'Cost analysis not available' },
      optimizations: optimizations || { details: [] },
      alerts: alerts || { alerts: [] },
      recent_learnings: learnings
    }
  });
});

app.get('/api/overnight/metrics', (req, res) => {
  const metrics = readJsonFile('claude_performance_metrics.json');

  if (!metrics) {
    return res.status(404).json({
      success: false,
      error: 'Metrics not available yet'
    });
  }

  res.json({
    success: true,
    metrics: metrics
  });
});

app.get('/api/overnight/research', async (req, res) => {
  try {
    const knowledgeGraph = readJsonFile('claude_knowledge_graph.json');

    // Read latest session discoveries from overnight automation
    const sessionFiles = fsSync.readdirSync(path.join(__dirname, 'data/overnight/sessions'))
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    let papers = [];
    let repos = [];

    // Find the most recent session with discoveries
    let latestSession = null;
    for (const sessionFile of sessionFiles) {
      try {
        const session = JSON.parse(
          fsSync.readFileSync(path.join(__dirname, 'data/overnight/sessions', sessionFile), 'utf8')
        );
        if (session.discoveries && (session.discoveries.papers?.length > 0 || session.discoveries.repos?.length > 0)) {
          latestSession = session;
          break;
        }
      } catch (e) {
        // Skip malformed files
        continue;
      }
    }

    if (latestSession && latestSession.discoveries) {
        // Get unique papers (filter out duplicates and "Unknown" titles)
        const seenPapers = new Set();
        papers = (latestSession.discoveries.papers || [])
          .filter(p => {
            // Filter out "Unknown" titles and duplicates (case-insensitive)
            if (!p.title || p.title.toLowerCase().includes('unknown') || p.title.trim() === '') return false;
            if (seenPapers.has(p.url)) return false;
            seenPapers.add(p.url);
            return true;
          })
          .map(p => ({
            title: p.title,
            summary: p.summary && p.summary !== '...' ? p.summary : 'No summary available',
            url: p.url,
            publishedAt: p.publishedAt || p.published,
            authors: p.authors || 'No authors listed',
            source: 'arxiv'
          }))
          .slice(0, 20); // Limit to 20 papers

        // Repos and packages already in use (check full repo names)
        const existingRepos = [
          'langflow-ai/langflow', 'langgenius/dify', 'anthropic-sdk',
          'claude-code', 'temporal', 'autokitteh', 'n8n-io/n8n',
          'react', 'express', 'axios', 'socket.io', 'getzep/graphiti',
          'getzep/zep', 'get-convex/convex-backend', 'lobehub/lobe-chat'
        ];

        // Keywords for relevant repos (our tech stack focus)
        const relevantKeywords = [
          { term: 'mcp', weight: 15 },
          { term: 'model context protocol', weight: 15 },
          { term: 'model-context-protocol', weight: 15 },
          { term: 'agentic', weight: 12 },
          { term: 'autonomous agent', weight: 12 },
          { term: 'workflow orchestration', weight: 10 },
          { term: 'multi-agent', weight: 12 },
          { term: 'llm agent', weight: 10 },
          { term: 'ai orchestration', weight: 10 },
          { term: 'swarm', weight: 8 },
          { term: 'agent runtime', weight: 10 },
          { term: 'workflow engine', weight: 8 },
          { term: 'event-driven', weight: 6 },
          { term: 'claude', weight: 8 },
          { term: 'anthropic', weight: 8 }
        ];

        // Score repos by relevance
        const scoreRelevance = (repo) => {
          let score = 0;
          const name = (repo.name || repo.full_name || '').toLowerCase();
          const desc = (repo.description || '').toLowerCase();
          const searchText = `${name} ${desc}`;

          relevantKeywords.forEach(({ term, weight }) => {
            if (searchText.includes(term.toLowerCase())) {
              score += weight;
            }
          });

          // Bonus for quality repos
          const stars = repo.stars || repo.stargazers_count || 0;
          if (stars > 1000) score += 3;
          if (stars > 5000) score += 5;
          if (stars > 10000) score += 7;

          return score;
        };

        // Get unique, relevant repos
        const seenRepos = new Set();
        repos = (latestSession.discoveries.repos || [])
          .filter(r => {
            const repoName = (r.name || r.full_name || '').toLowerCase();
            const url = r.url || r.html_url || '';

            // Skip if duplicate
            if (seenRepos.has(url)) return false;

            // Skip if already using this repo/package (exact match or contains)
            const isExisting = existingRepos.some(existing => {
              const existingLower = existing.toLowerCase();
              return repoName === existingLower ||
                     repoName.includes(existingLower) ||
                     existingLower.includes(repoName);
            });

            if (isExisting) return false;

            seenRepos.add(url);
            return true;
          })
          .map(r => ({
            name: r.name || r.full_name,
            description: r.description || 'No description available',
            url: (r.html_url || r.url || '').replace('api.github.com/repos/', 'github.com/'),
            stars: r.stars || r.stargazers_count || 0,
            language: r.language || 'Unknown',
            source: 'github',
            relevance_score: scoreRelevance(r)
          }))
          .filter(r => r.relevance_score > 0) // Only keep relevant repos
          .sort((a, b) => b.relevance_score - a.relevance_score) // Sort by relevance
          .slice(0, 15); // Top 15 most relevant
      }

    res.json({
      success: true,
      research: {
        papers: papers,
        repos: repos,
        knowledge_entities: knowledgeGraph?.entities || [],
        learning_count: knowledgeGraph?.entities?.length || 0,
        total_papers: papers.length,
        total_repos: repos.length
      }
    });
  } catch (error) {
    console.error('Error reading research data:', error);
    const knowledgeGraph = readJsonFile('claude_knowledge_graph.json');
    res.json({
      success: true,
      research: {
        papers: [],
        repos: [],
        knowledge_entities: knowledgeGraph?.entities || [],
        learning_count: knowledgeGraph?.entities?.length || 0,
        error: error.message
      }
    });
  }
});

// POST endpoint for discovering research (ArXiv + GitHub)
app.post('/api/overnight/discover-research', async (req, res) => {
  try {
    const axios = require('axios');
    const xml2js = require('xml2js');

    // Fetch recent AI/ML papers from ArXiv
    const arxivQuery = 'cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.NE';
    const arxivUrl = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(arxivQuery)}&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending`;

    let papers = [];
    let repos = [];

    try {
      const arxivResponse = await axios.get(arxivUrl, { timeout: 30000 });
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(arxivResponse.data);

      if (result.feed && result.feed.entry) {
        papers = result.feed.entry.map(entry => {
          // Extract authors array
          let authors = 'No authors listed';
          if (entry.author && Array.isArray(entry.author)) {
            const authorNames = entry.author.map(a => a.name ? a.name[0] : '').filter(n => n);
            if (authorNames.length > 0) {
              authors = authorNames.join(', ');
            }
          }

          return {
            title: entry.title ? entry.title[0].replace(/\n/g, ' ').trim() : 'Unknown',
            summary: entry.summary ? entry.summary[0].replace(/\n/g, ' ').trim() : 'No summary available',
            url: entry.id ? entry.id[0] : '',
            publishedAt: entry.published ? entry.published[0] : new Date().toISOString(),
            authors: authors,
            source: 'arxiv'
          };
        }).filter(p => p.title && !p.title.toLowerCase().includes('unknown'));
      }
    } catch (arxivError) {
      console.error('ArXiv fetch error:', arxivError.message);
    }

    // Fetch trending GitHub repos (simplified - you may want to use GitHub API)
    try {
      const githubQuery = 'mcp OR "model context protocol" OR agentic OR "multi-agent"';
      const githubUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(githubQuery)}&sort=stars&order=desc&per_page=50`;

      const githubResponse = await axios.get(githubUrl, {
        timeout: 30000,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'KutiraAI-Research-Bot'
        }
      });

      if (githubResponse.data && githubResponse.data.items) {
        repos = githubResponse.data.items.map(repo => ({
          name: repo.full_name,
          description: repo.description || 'No description available',
          url: repo.html_url,
          stars: repo.stargazers_count,
          language: repo.language || 'Unknown',
          source: 'github'
        }));
      }
    } catch (githubError) {
      console.error('GitHub fetch error:', githubError.message);
    }

    res.json({
      success: true,
      papers: papers,
      repos: repos,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Research discovery error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      papers: [],
      repos: []
    });
  }
});

// ===== AUTOKITTEH ENDPOINTS =====
app.get('/api/autokitteh/sessions', (req, res) => {
  res.json({
    success: true,
    sessions: [
      {
        id: 'ses_01k8f2v896frxb59z84172zxfk',
        deployment_id: 'dep_01k8f2v896frxb59z84172zxfk',
        workflow: 'claude_performance_monitor',
        status: 'active',
        started_at: new Date(Date.now() - 3600000).toISOString(),
        last_activity: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/autokitteh/triggers', (req, res) => {
  res.json({
    success: true,
    triggers: [
      {
        id: 'trg_performance_check',
        name: 'Performance Check (Every 15min)',
        type: 'schedule',
        schedule: '*/15 * * * *',
        enabled: true,
        last_triggered: new Date().toISOString()
      },
      {
        id: 'trg_pattern_analysis',
        name: 'Pattern Analysis (Hourly)',
        type: 'schedule',
        schedule: '0 * * * *',
        enabled: true,
        last_triggered: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 'trg_deep_learning',
        name: 'Deep Learning (Every 6h)',
        type: 'schedule',
        schedule: '0 */6 * * *',
        enabled: true,
        last_triggered: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  });
});

app.get('/api/autokitteh/deployment', (req, res) => {
  res.json({
    success: true,
    deployment: {
      id: 'dep_01k8f2v896frxb59z84172zxfk',
      project: 'autonomous_system',
      state: 'active',
      workflows: ['claude_performance_monitor'],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    }
  });
});

// ===== GITHUB SMART SEARCH ENDPOINT =====
app.get('/api/github/search', async (req, res) => {
  try {
    const https = require('https');

    // Our tech stack keywords for intelligent matching
    const techStack = [
      'temporal workflow',
      'autokitteh',
      'n8n automation',
      'workflow orchestration',
      'mcp model context protocol',
      'react dashboard',
      'event-driven automation',
      'temporal.io'
    ];

    // Search query combining our interests
    const searchQueries = [
      'temporal workflow orchestration stars:>100',
      'autokitteh OR n8n automation stars:>50',
      'workflow engine react dashboard stars:>100',
      'mcp protocol OR model context protocol stars:>10',
      'event-driven workflow automation stars:>75'
    ];

    const allRepos = [];
    const seenRepos = new Set();

    // Function to fetch from GitHub API
    const fetchGitHub = (query) => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.github.com',
          path: `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`,
          method: 'GET',
          headers: {
            'User-Agent': 'Kutiraai-Automation-Dashboard',
            'Accept': 'application/vnd.github.v3+json'
          }
        };

        // Add GitHub token if available
        if (process.env.GITHUB_TOKEN) {
          options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        const githubReq = https.request(options, (githubRes) => {
          let data = '';

          githubRes.on('data', (chunk) => {
            data += chunk;
          });

          githubRes.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve(result);
            } catch (err) {
              reject(err);
            }
          });
        });

        githubReq.on('error', (err) => {
          reject(err);
        });

        githubReq.end();
      });
    };

    // Execute searches in parallel
    const searchPromises = searchQueries.map(query =>
      fetchGitHub(query).catch(err => ({ items: [] }))
    );

    const results = await Promise.all(searchPromises);

    // Collect and deduplicate repos
    results.forEach(result => {
      if (result.items) {
        result.items.forEach(repo => {
          const repoId = repo.full_name;
          if (!seenRepos.has(repoId)) {
            seenRepos.add(repoId);

            // Calculate relevance score
            let relevanceScore = 0;
            const desc = (repo.description || '').toLowerCase();
            const name = repo.full_name.toLowerCase();
            const topics = (repo.topics || []).join(' ').toLowerCase();

            // Check for tech stack matches
            techStack.forEach(keyword => {
              if (desc.includes(keyword) || name.includes(keyword) || topics.includes(keyword)) {
                relevanceScore += 10;
              }
            });

            // Boost for recent activity (updated in last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            if (new Date(repo.updated_at) > sixMonthsAgo) {
              relevanceScore += 5;
            }

            // Boost for good documentation
            if (repo.has_wiki || repo.has_pages) {
              relevanceScore += 3;
            }

            // Boost for active development
            if (repo.open_issues_count > 0 && repo.open_issues_count < 100) {
              relevanceScore += 2;
            }

            allRepos.push({
              name: repo.name,
              full_name: repo.full_name,
              description: repo.description,
              url: repo.html_url,
              stars: repo.stargazers_count,
              language: repo.language,
              topics: repo.topics || [],
              updated_at: repo.updated_at,
              relevance_score: relevanceScore,
              open_issues: repo.open_issues_count,
              forks: repo.forks_count
            });
          }
        });
      }
    });

    // Sort by relevance score first, then stars
    allRepos.sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      return b.stars - a.stars;
    });

    // Return top 20 most relevant repos
    const topRepos = allRepos.slice(0, 20);

    res.json({
      success: true,
      repos: topRepos,
      total: topRepos.length,
      search_strategy: 'intelligent_multi_query',
      tech_stack: techStack
    });

  } catch (error) {
    console.error('[GitHub Search] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      repos: [],
      total: 0
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 MCP Backend API Server running on http://localhost:${PORT}`);
  console.log(`📡 Serving MCP server management for frontend at http://localhost:3001`);
  console.log(`🤖 AI Orchestrator endpoints available at /api/orchestrator/*`);
  console.log(`✅ Temporal endpoints available at /api/temporal/*`);
  console.log(`🌙 Overnight automation endpoints available at /api/overnight/*`);
  console.log(`🔧 AutoKitteh endpoints available at /api/autokitteh/*`);
});
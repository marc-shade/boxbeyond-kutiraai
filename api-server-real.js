/**
 * Real MCP API Server
 * Provides backend API for real MCP server integration
 * Replaces mock implementations with actual MCP connections
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const WebSocket = require('ws');
const { exec } = require('child_process');
const { promisify } = require('util');

const app = express();
const execAsync = promisify(exec);
const PORT = process.env.PORT || 3002;

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Real MCP server configurations
const MCP_SERVERS = {
  'claude-flow': {
    baseUrl: process.env.CLAUDE_FLOW_URL || 'http://localhost:4001',
    endpoints: {
      health: '/health',
      swarmInit: '/swarm_init',
      agentSpawn: '/agent_spawn',
      memoryUsage: '/memory_usage',
      taskOrchestrate: '/task_orchestrate',
      swarmStatus: '/swarm_status'
    }
  },
  'voice-mode': {
    baseUrl: process.env.VOICE_MODE_URL || 'http://localhost:4003',
    endpoints: {
      health: '/health',
      converse: '/converse',
      voiceStatus: '/voice_status',
      service: '/service',
      listVoices: '/list_tts_voices'
    }
  },
  'enhanced-memory': {
    baseUrl: process.env.MEMORY_URL || 'http://localhost:4002',
    endpoints: {
      health: '/health',
      createEntities: '/create_entities',
      searchNodes: '/search_nodes',
      getStatus: '/get_memory_status'
    }
  },
  'task-manager': {
    baseUrl: process.env.TASK_MANAGER_URL || 'http://localhost:4004',
    endpoints: {
      health: '/health',
      createTask: '/create_task',
      prioritizeTasks: '/prioritize_tasks',
      getTaskStatus: '/get_task_status',
      getTasks: '/get_tasks'
    }
  }
};

// Health cache to reduce load on MCP servers
const healthCache = new Map();
const CACHE_TIMEOUT = 30000; // 30 seconds

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 3003 });

// Broadcast updates to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Check real MCP server health
async function checkServerHealth(serverName) {
  const server = MCP_SERVERS[serverName];
  if (!server) return null;

  // Check cache first
  const cached = healthCache.get(serverName);
  if (cached && (Date.now() - cached.timestamp < CACHE_TIMEOUT)) {
    return cached.data;
  }

  try {
    const response = await axios.get(
      `${server.baseUrl}${server.endpoints.health}`,
      { timeout: 5000 }
    );

    const healthData = {
      name: serverName,
      status: 'running',
      health: 'healthy',
      baseUrl: server.baseUrl,
      tools: Object.keys(server.endpoints).filter(e => e !== 'health'),
      lastCheck: new Date().toISOString(),
      responseTime: response.headers['x-response-time'] || 'N/A',
      data: response.data
    };

    // Cache the result
    healthCache.set(serverName, {
      timestamp: Date.now(),
      data: healthData
    });

    return healthData;
  } catch (error) {
    return {
      name: serverName,
      status: 'stopped',
      health: 'unhealthy',
      baseUrl: server.baseUrl,
      tools: Object.keys(server.endpoints).filter(e => e !== 'health'),
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

// Execute MCP tool
async function executeMCPTool(serverName, toolName, params = {}) {
  const server = MCP_SERVERS[serverName];
  if (!server) {
    throw new Error(`Server ${serverName} not found`);
  }

  const endpoint = server.endpoints[toolName];
  if (!endpoint) {
    throw new Error(`Tool ${toolName} not found in ${serverName}`);
  }

  const response = await axios.post(
    `${server.baseUrl}${endpoint}`,
    params,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    }
  );

  return response.data;
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Real MCP API Server',
    timestamp: new Date().toISOString()
  });
});

// Get all MCP server status
app.get('/api/mcp/services', async (req, res) => {
  try {
    const services = [];

    for (const serverName of Object.keys(MCP_SERVERS)) {
      const health = await checkServerHealth(serverName);
      if (health) services.push(health);
    }

    // Broadcast status update to WebSocket clients
    broadcast({ type: 'services_update', data: services });

    res.json(services);
  } catch (error) {
    console.error('Failed to get services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system metrics
app.get('/api/mcp/metrics', async (req, res) => {
  try {
    const services = await Promise.all(
      Object.keys(MCP_SERVERS).map(name => checkServerHealth(name))
    );

    // Try to get memory status
    let memoryData = {};
    try {
      memoryData = await executeMCPTool('enhanced-memory', 'getStatus');
    } catch (err) {
      console.log('Memory service unavailable');
    }

    // Try to get task status
    let taskData = [];
    try {
      taskData = await executeMCPTool('task-manager', 'getTasks');
    } catch (err) {
      console.log('Task service unavailable');
    }

    const metrics = {
      services: {
        total: services.length,
        healthy: services.filter(s => s?.health === 'healthy').length,
        unhealthy: services.filter(s => s?.health === 'unhealthy').length
      },
      memory: {
        entity_count: memoryData.entity_count || 0,
        relationship_count: memoryData.relationship_count || 0,
        compression_ratio: memoryData.compression_ratio || 0
      },
      tasks: {
        total: taskData.length || 0,
        pending: taskData.filter(t => t.status === 'pending').length || 0,
        completed: taskData.filter(t => t.status === 'completed').length || 0
      },
      timestamp: new Date().toISOString()
    };

    // Broadcast metrics update
    broadcast({ type: 'metrics_update', data: metrics });

    res.json(metrics);
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute MCP tool endpoint
app.post('/api/mcp/execute', async (req, res) => {
  try {
    const { service, tool, params } = req.body;

    if (!service || !tool) {
      return res.status(400).json({
        error: 'Service and tool are required'
      });
    }

    const result = await executeMCPTool(service, tool, params);

    // Broadcast tool execution
    broadcast({
      type: 'tool_executed',
      data: { service, tool, success: true }
    });

    res.json({
      success: true,
      service,
      tool,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to execute tool:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Voice system endpoints
app.post('/api/voice/stt', async (req, res) => {
  try {
    const result = await executeMCPTool('voice-mode', 'converse', {
      message: 'Listening for speech...',
      wait_for_response: true,
      listen_duration: req.body.duration || 10
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/voice/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    const result = await executeMCPTool('voice-mode', 'converse', {
      message: text,
      voice: voice,
      wait_for_response: false
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agent spawning endpoint
app.post('/api/agent/spawn', async (req, res) => {
  try {
    const { type, capabilities, name } = req.body;

    // Initialize swarm if needed
    await executeMCPTool('claude-flow', 'swarmInit', {
      topology: 'hierarchical',
      maxAgents: 10
    });

    // Spawn the agent
    const result = await executeMCPTool('claude-flow', 'agentSpawn', {
      type: type || 'coordinator',
      capabilities: capabilities || [],
      name: name || `agent-${Date.now()}`
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Memory operations endpoints
app.post('/api/memory/create', async (req, res) => {
  try {
    const { entities } = req.body;
    const result = await executeMCPTool('enhanced-memory', 'createEntities', {
      entities: entities
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/memory/search', async (req, res) => {
  try {
    const { query, limit } = req.body;
    const result = await executeMCPTool('enhanced-memory', 'searchNodes', {
      query: query,
      limit: limit || 10
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task management endpoints
app.post('/api/task/create', async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const result = await executeMCPTool('task-manager', 'createTask', {
      title,
      description,
      priority: priority || 'medium'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/task/list', async (req, res) => {
  try {
    const { status } = req.query;
    const result = await executeMCPTool('task-manager', 'getTasks', {
      status: status || null
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start periodic health checks
setInterval(async () => {
  try {
    const services = [];
    for (const serverName of Object.keys(MCP_SERVERS)) {
      const health = await checkServerHealth(serverName);
      if (health) services.push(health);
    }

    // Broadcast periodic update
    broadcast({
      type: 'periodic_health',
      data: services,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
  }
}, 30000); // Every 30 seconds

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      } else if (data.type === 'request_status') {
        // Send immediate status update
        const services = [];
        for (const serverName of Object.keys(MCP_SERVERS)) {
          const health = await checkServerHealth(serverName);
          if (health) services.push(health);
        }
        ws.send(JSON.stringify({
          type: 'services_update',
          data: services
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Real MCP API Server running on port ${PORT}`);
  console.log(`📡 WebSocket server running on port 3003`);
  console.log(`🔗 Frontend: http://localhost:3001`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log('\nConnected MCP Servers:');
  Object.entries(MCP_SERVERS).forEach(([name, config]) => {
    console.log(`  - ${name}: ${config.baseUrl}`);
  });
});
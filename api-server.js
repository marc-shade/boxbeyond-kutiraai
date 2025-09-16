const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const cors = require('cors');

const app = express();
const execAsync = promisify(exec);
const PORT = process.env.PORT || 3002;

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3001',
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 MCP Backend API Server running on http://localhost:${PORT}`);
  console.log(`📡 Serving MCP server management for frontend at http://localhost:3001`);
});
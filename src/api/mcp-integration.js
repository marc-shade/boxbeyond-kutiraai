// Browser-compatible MCP API integration
const API_BASE_URL = 'http://localhost:3002/api';

/**
 * Real MCP Integration Service
 * Connects to actual MCP servers running on the system
 */
class MCPIntegrationService {
  constructor() {
    this.mcpBasePath = '/Users/marc/Documents/Cline/MCP';
    this.claudeConfigPath = '/Users/marc/.claude/claude_fixed.json';
    
    // MCP server configurations
    this.servers = {
      'claude-flow': {
        path: `${this.mcpBasePath}/claude-flow-mcp`,
        command: 'node server.js',
        port: null,
        tools: ['swarm_init', 'agent_spawn', 'swarm_status', 'memory_usage', 'bottleneck_analyze']
      },
      'enhanced-memory': {
        path: `${this.mcpBasePath}/enhanced-memory-mcp`,
        command: 'node server.js',
        port: null,
        tools: ['create_entities', 'search_nodes', 'get_memory_status', 'read_graph', 'create_relations']
      },
      'voice-mode': {
        path: `${this.mcpBasePath}/voice-mode`,
        command: 'python3 server.py',
        port: 2022,
        tools: ['converse', 'voice_status', 'service', 'list_tts_voices', 'voice_registry']
      },
      'ai-persona-lab': {
        path: `${this.mcpBasePath}/ai-persona-lab-mcp`,
        command: 'python3 server.py',
        port: 9201,
        tools: ['create_persona', 'list_personas', 'create_experiment', 'run_experiment', 'analyze_experiment']
      },
      'task-manager': {
        path: `${this.mcpBasePath}/task-manager-mcp`,
        command: 'node server.js',
        port: null,
        tools: ['create_task', 'prioritize_tasks', 'generate_sprint_plan', 'identify_bottlenecks']
      },
      'confidence-orchestrator': {
        path: `${this.mcpBasePath}/confidence-orchestrator-mcp`,
        command: 'node server.js',
        port: null,
        tools: ['evaluate_confidence', 'route_agent', 'evaluate_swarm_confidence', 'check_early_termination']
      }
    };
  }

  /**
   * Check if an MCP server is running
   */
  async checkServerStatus(serverName) {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/servers/${serverName}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        tools: 0
      };
    }
  }

  /**
   * Get status of all MCP servers
   */
  async getAllServerStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/servers`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get server status:', error);
      return {
        servers: {},
        totalActive: 0,
        totalAvailable: 0,
        connectionError: true,
        errorMessage: error.message
      };
    }
  }

  /**
   * Start an MCP server
   */
  async startServer(serverName) {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/servers/${serverName}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to start ${serverName}: ${error.message}`);
    }
  }

  /**
   * Stop an MCP server
   */
  async stopServer(serverName) {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/servers/${serverName}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to stop ${serverName}: ${error.message}`);
    }
  }

  /**
   * Get total MCP process count
   */
  async getTotalMCPProcesses() {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/processes`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check memory usage
   */
  async getMemoryUsage() {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/memory`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { total: 0, node: 0, python: 0, limit: 6144 };
    }
  }

  /**
   * Launch Flow Nexus
   */
  async launchFlowNexus(mode = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/flow-nexus/launch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to launch Flow Nexus: ${error.message}`);
    }
  }

  /**
   * Create and spawn an agent swarm
   */
  async createSwarm(swarmType, task) {
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
    if (!config) throw new Error('Unknown swarm type');

    // This would integrate with claude-flow MCP to actually spawn agents
    return {
      swarmType,
      task,
      agents: config.agents,
      tools: config.tools,
      status: 'initialized',
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const mcpIntegration = new MCPIntegrationService();

// Export API
export const mcpAPI = {
  // Server management
  checkServerStatus: (serverName) => mcpIntegration.checkServerStatus(serverName),
  getAllServerStatus: () => mcpIntegration.getAllServerStatus(),
  startServer: (serverName) => mcpIntegration.startServer(serverName),
  stopServer: (serverName) => mcpIntegration.stopServer(serverName),
  
  // System monitoring
  getTotalMCPProcesses: () => mcpIntegration.getTotalMCPProcesses(),
  getMemoryUsage: () => mcpIntegration.getMemoryUsage(),
  
  // Flow Nexus
  launchFlowNexus: (mode) => mcpIntegration.launchFlowNexus(mode),
  
  // Swarm management
  createSwarm: (swarmType, task) => mcpIntegration.createSwarm(swarmType, task)
};

export default mcpAPI;
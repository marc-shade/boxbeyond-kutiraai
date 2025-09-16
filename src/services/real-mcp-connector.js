/**
 * Real MCP Connector Service
 * Replaces mock implementations with actual MCP server connections
 */

import axios from 'axios';

const MCP_CONFIG = {
  // Real MCP servers from your environment
  servers: {
    'claude-flow': {
      baseUrl: import.meta.env.VITE_CLAUDE_FLOW_URL || 'http://localhost:4001',
      endpoints: {
        health: '/health',
        swarmInit: '/swarm_init',
        agentSpawn: '/agent_spawn',
        memoryUsage: '/memory_usage',
        taskOrchestrate: '/task_orchestrate'
      }
    },
    'voice-mode': {
      baseUrl: import.meta.env.VITE_VOICE_MODE_URL || 'http://localhost:4003',
      endpoints: {
        health: '/health',
        converse: '/converse',
        voiceStatus: '/voice_status',
        service: '/service',
        listVoices: '/list_tts_voices'
      }
    },
    'enhanced-memory': {
      baseUrl: import.meta.env.VITE_MEMORY_URL || 'http://localhost:4002',
      endpoints: {
        health: '/health',
        createEntities: '/create_entities',
        searchNodes: '/search_nodes',
        getStatus: '/get_memory_status'
      }
    },
    'task-manager': {
      baseUrl: import.meta.env.VITE_TASK_MANAGER_URL || 'http://localhost:4004',
      endpoints: {
        health: '/health',
        createTask: '/create_task',
        prioritizeTasks: '/prioritize_tasks',
        getTaskStatus: '/get_task_status',
        getTasks: '/get_tasks'
      }
    }
  }
};

class RealMCPConnector {
  constructor() {
    this.servers = MCP_CONFIG.servers;
    this.healthCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Get real-time health status of all MCP servers
   */
  async getServicesHealth() {
    const services = [];

    for (const [name, config] of Object.entries(this.servers)) {
      try {
        // Check cache first
        const cached = this.healthCache.get(name);
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
          services.push(cached.data);
          continue;
        }

        // Make real health check
        const response = await axios.get(
          `${config.baseUrl}${config.endpoints.health}`,
          { timeout: 5000 }
        );

        const serviceData = {
          name,
          status: 'running',
          health: 'healthy',
          port: new URL(config.baseUrl).port,
          tools: Object.keys(config.endpoints).filter(e => e !== 'health'),
          description: this.getServiceDescription(name),
          lastCheck: new Date().toISOString(),
          responseTime: response.headers['x-response-time'] || 'N/A'
        };

        // Cache the result
        this.healthCache.set(name, {
          timestamp: Date.now(),
          data: serviceData
        });

        services.push(serviceData);
      } catch (error) {
        services.push({
          name,
          status: 'stopped',
          health: 'unhealthy',
          port: new URL(config.baseUrl).port,
          tools: Object.keys(config.endpoints).filter(e => e !== 'health'),
          description: this.getServiceDescription(name),
          error: error.message,
          lastCheck: new Date().toISOString()
        });
      }
    }

    return services;
  }

  /**
   * Execute a real MCP tool
   */
  async executeTool(serviceName, toolName, params = {}) {
    const service = this.servers[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const endpoint = service.endpoints[toolName];
    if (!endpoint) {
      throw new Error(`Tool ${toolName} not found in ${serviceName}`);
    }

    try {
      const response = await axios.post(
        `${service.baseUrl}${endpoint}`,
        params,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout for tool execution
        }
      );

      return {
        success: true,
        service: serviceName,
        tool: toolName,
        result: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        service: serviceName,
        tool: toolName,
        error: error.response?.data?.error || error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Voice System Integration
   */
  async testSTT() {
    try {
      const response = await this.executeTool('voice-mode', 'converse', {
        message: 'Testing speech to text functionality',
        wait_for_response: true,
        listen_duration: 10
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testTTS(text = 'Hello! This is a test of the text to speech system.') {
    try {
      const response = await this.executeTool('voice-mode', 'converse', {
        message: text,
        wait_for_response: false
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Agent Spawning via Claude Flow
   */
  async spawnAgent(agentType, capabilities = []) {
    try {
      // First initialize swarm if needed
      await this.executeTool('claude-flow', 'swarmInit', {
        topology: 'hierarchical',
        maxAgents: 10
      });

      // Then spawn the agent
      const response = await this.executeTool('claude-flow', 'agentSpawn', {
        type: agentType,
        capabilities: capabilities,
        name: `${agentType}-${Date.now()}`
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Memory Operations
   */
  async createMemoryEntity(entities) {
    return this.executeTool('enhanced-memory', 'createEntities', {
      entities: entities
    });
  }

  async searchMemory(query, limit = 10) {
    return this.executeTool('enhanced-memory', 'searchNodes', {
      query: query,
      limit: limit
    });
  }

  async getMemoryStatus() {
    return this.executeTool('enhanced-memory', 'getStatus', {});
  }

  /**
   * Task Management
   */
  async createTask(title, description, priority = 'medium') {
    return this.executeTool('task-manager', 'createTask', {
      title: title,
      description: description,
      priority: priority
    });
  }

  async getTasks(status = null) {
    return this.executeTool('task-manager', 'getTasks', {
      status: status
    });
  }

  /**
   * Get real-time metrics from actual system
   */
  async getSystemMetrics() {
    try {
      // Collect metrics from all services
      const services = await this.getServicesHealth();

      // Get memory status
      const memoryStatus = await this.getMemoryStatus();

      // Get task statistics
      const tasks = await this.getTasks();

      return {
        services: {
          total: services.length,
          healthy: services.filter(s => s.health === 'healthy').length,
          unhealthy: services.filter(s => s.health === 'unhealthy').length
        },
        memory: memoryStatus.result || {},
        tasks: {
          total: tasks.result?.length || 0,
          pending: tasks.result?.filter(t => t.status === 'pending').length || 0,
          completed: tasks.result?.filter(t => t.status === 'completed').length || 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Helper to get service descriptions
   */
  getServiceDescription(name) {
    const descriptions = {
      'claude-flow': 'Swarm coordination and orchestration',
      'voice-mode': 'Voice conversations and TTS/STT',
      'enhanced-memory': 'Knowledge graph and memory management',
      'task-manager': 'AI-powered task management'
    };
    return descriptions[name] || 'MCP Service';
  }
}

// Create singleton instance
const mcpConnector = new RealMCPConnector();

export default mcpConnector;
/**
 * KutiraAI MCP API Services
 * Comprehensive service layer for MCP backend integration
 * 
 * @description Production-ready MCP API service with WebSocket support, 
 * auto-reconnection, error handling, and TypeScript-compatible JSDoc comments
 * @version 1.0.0
 * @author Frontend Specialist
 */

/**
 * @typedef {Object} MCPService
 * @property {string} id - Service identifier
 * @property {string} name - Service name
 * @property {string} status - Service status (active|inactive|error)
 * @property {Array<Object>} tools - Available tools
 * @property {Object} metadata - Service metadata
 */

/**
 * @typedef {Object} MCPTool
 * @property {string} id - Tool identifier
 * @property {string} name - Tool name
 * @property {string} description - Tool description
 * @property {Object} parameters - Tool parameters schema
 */

/**
 * @typedef {Object} SystemMetrics
 * @property {number} cpu_usage - CPU usage percentage
 * @property {number} memory_usage - Memory usage percentage
 * @property {number} disk_usage - Disk usage percentage
 * @property {number} active_services - Number of active services
 * @property {number} total_requests - Total requests processed
 * @property {number} error_rate - Error rate percentage
 */

/**
 * @typedef {Object} AgentSpawnOptions
 * @property {string} type - Agent type
 * @property {string} task - Task description
 * @property {Object} config - Agent configuration
 * @property {number} timeout - Timeout in milliseconds
 * @property {string} priority - Task priority (low|medium|high|critical)
 */

// Configuration constants
const CONFIG = {
  BASE_URL: 'http://localhost:8000',
  WS_URL: 'ws://localhost:8000/ws/mcp',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  RECONNECT_INTERVAL: 5000,
  HEARTBEAT_INTERVAL: 30000,
  MAX_RECONNECT_ATTEMPTS: 10
};

/**
 * Utility function for exponential backoff
 * @param {number} attempt - Current attempt number
 * @returns {number} Delay in milliseconds
 */
const getBackoffDelay = (attempt) => {
  return Math.min(CONFIG.RETRY_DELAY * Math.pow(2, attempt), 10000);
};

/**
 * Enhanced error class for MCP-specific errors
 */
class MCPError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * WebSocket Connection Manager with auto-reconnection
 */
class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      maxReconnectAttempts: CONFIG.MAX_RECONNECT_ATTEMPTS,
      reconnectInterval: CONFIG.RECONNECT_INTERVAL,
      heartbeatInterval: CONFIG.HEARTBEAT_INTERVAL,
      ...options
    };
    
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.eventListeners = new Map();
    this.messageQueue = [];
    this.isReconnecting = false;
  }

  /**
   * Connect to WebSocket with auto-reconnection
   * @returns {Promise<void>}
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('[MCP WebSocket] Connected successfully');
          this.isConnected = true;
          this.isReconnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('[MCP WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[MCP WebSocket] Connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          
          if (!this.isReconnecting && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[MCP WebSocket] Connection error:', error);
          if (!this.isConnected) {
            reject(new MCPError('WebSocket connection failed', 'WEBSOCKET_ERROR', { error }));
          }
        };

      } catch (error) {
        reject(new MCPError('Failed to create WebSocket connection', 'WEBSOCKET_INIT_ERROR', { error }));
      }
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.isReconnecting || this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      return;
    }

    this.isReconnecting = true;
    const delay = getBackoffDelay(this.reconnectAttempts);
    
    console.log(`[MCP WebSocket] Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      try {
        await this.connect();
      } catch (error) {
        console.error('[MCP WebSocket] Reconnection failed:', error);
        if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('[MCP WebSocket] Max reconnection attempts reached');
          this.emit('maxReconnectAttemptsReached');
        }
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} data - Parsed message data
   */
  handleMessage(data) {
    if (data.type === 'pong') {
      return; // Handle heartbeat response
    }

    this.emit('message', data);
    
    // Handle specific message types
    if (data.type) {
      this.emit(data.type, data);
    }
  }

  /**
   * Send message through WebSocket with queuing
   * @param {Object} message - Message to send
   */
  send(message) {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[MCP WebSocket] Failed to send message:', error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Subscribe to WebSocket events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  /**
   * Unsubscribe from WebSocket events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[MCP WebSocket] Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Close WebSocket connection
   */
  close() {
    this.isReconnecting = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client closing connection');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.eventListeners.clear();
    this.messageQueue = [];
  }

  /**
   * Get connection status
   * @returns {Object} Connection status information
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      readyState: this.ws?.readyState
    };
  }
}

/**
 * HTTP Client with retry logic and enhanced error handling
 */
class HTTPClient {
  constructor(baseURL = CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    let lastError;
    
    for (let attempt = 0; attempt < CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new MCPError(
            `HTTP ${response.status}: ${response.statusText}`,
            'HTTP_ERROR',
            {
              status: response.status,
              statusText: response.statusText,
              url: url
            }
          );
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        
        return await response.text();

      } catch (error) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          throw new MCPError('Request timeout', 'TIMEOUT_ERROR', { url, timeout: config.timeout });
        }

        if (attempt < CONFIG.RETRY_ATTEMPTS - 1) {
          const delay = getBackoffDelay(attempt);
          console.warn(`[MCP HTTP] Request failed, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new MCPError(
      `Request failed after ${CONFIG.RETRY_ATTEMPTS} attempts: ${lastError?.message}`,
      'REQUEST_FAILED',
      { lastError, url, attempts: CONFIG.RETRY_ATTEMPTS }
    );
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Main MCP Services API Class
 */
class MCPServices {
  constructor() {
    this.httpClient = new HTTPClient();
    this.wsManager = null;
    this.isInitialized = false;
    this.eventSubscriptions = new Map();
  }

  /**
   * Initialize MCP services with WebSocket connection
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize WebSocket connection
      this.wsManager = new WebSocketManager(CONFIG.WS_URL);
      await this.wsManager.connect();

      // Set up event handlers
      this.setupEventHandlers();
      
      this.isInitialized = true;
      console.log('[MCP Services] Initialized successfully');
    } catch (error) {
      console.error('[MCP Services] Initialization failed:', error);
      throw new MCPError('Failed to initialize MCP services', 'INIT_ERROR', { error });
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  setupEventHandlers() {
    this.wsManager.on('message', (data) => {
      this.handleRealtimeEvent(data);
    });

    this.wsManager.on('serviceStatusChanged', (data) => {
      this.emit('serviceStatusChanged', data);
    });

    this.wsManager.on('agentSpawned', (data) => {
      this.emit('agentSpawned', data);
    });

    this.wsManager.on('toolExecutionResult', (data) => {
      this.emit('toolExecutionResult', data);
    });

    this.wsManager.on('systemMetricsUpdate', (data) => {
      this.emit('systemMetricsUpdate', data);
    });

    this.wsManager.on('maxReconnectAttemptsReached', () => {
      this.emit('connectionError', {
        message: 'WebSocket connection lost and could not be restored',
        code: 'CONNECTION_FAILED'
      });
    });
  }

  /**
   * Handle real-time events from WebSocket
   * @param {Object} data - Event data
   */
  handleRealtimeEvent(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'service_status_update':
        this.emit('serviceStatusUpdate', payload);
        break;
      case 'agent_progress':
        this.emit('agentProgress', payload);
        break;
      case 'system_alert':
        this.emit('systemAlert', payload);
        break;
      default:
        this.emit('realtimeEvent', data);
    }
  }

  /**
   * Subscribe to real-time events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  subscribe(event, callback) {
    if (!this.eventSubscriptions.has(event)) {
      this.eventSubscriptions.set(event, new Set());
    }
    this.eventSubscriptions.get(event).add(callback);
  }

  /**
   * Unsubscribe from real-time events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  unsubscribe(event, callback) {
    if (this.eventSubscriptions.has(event)) {
      this.eventSubscriptions.get(event).delete(callback);
    }
  }

  /**
   * Emit event to all subscribers
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.eventSubscriptions.has(event)) {
      this.eventSubscriptions.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[MCP Services] Event callback error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get all MCP services
   * @returns {Promise<MCPService[]>} Array of MCP services
   */
  async getMCPServices() {
    try {
      const services = await this.httpClient.get('/api/v1/mcp/services');
      return services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
        tools: service.tools || [],
        metadata: service.metadata || {},
        lastUpdated: service.last_updated,
        version: service.version
      }));
    } catch (error) {
      throw new MCPError('Failed to fetch MCP services', 'GET_SERVICES_ERROR', { error });
    }
  }

  /**
   * Execute MCP tool
   * @param {string} serviceId - Service identifier
   * @param {string} toolName - Tool name
   * @param {Object} params - Tool parameters
   * @returns {Promise<any>} Tool execution result
   */
  async executeMCPTool(serviceId, toolName, params = {}) {
    try {
      const result = await this.httpClient.post('/api/v1/mcp/execute', {
        service_id: serviceId,
        tool_name: toolName,
        parameters: params,
        timestamp: new Date().toISOString()
      });

      // Emit real-time event
      this.emit('toolExecuted', {
        serviceId,
        toolName,
        params,
        result,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      throw new MCPError(
        `Failed to execute tool ${toolName} on service ${serviceId}`,
        'TOOL_EXECUTION_ERROR',
        { serviceId, toolName, params, error }
      );
    }
  }

  /**
   * Get health status of all MCP services
   * @returns {Promise<Object>} Health status information
   */
  async getHealthStatus() {
    try {
      const health = await this.httpClient.get('/api/v1/mcp/health');
      return {
        overall_status: health.overall_status,
        services: health.services,
        system_info: health.system_info,
        last_check: health.last_check,
        uptime: health.uptime
      };
    } catch (error) {
      throw new MCPError('Failed to fetch health status', 'HEALTH_CHECK_ERROR', { error });
    }
  }

  /**
   * Get system performance metrics
   * @returns {Promise<SystemMetrics>} System metrics
   */
  async getSystemMetrics() {
    try {
      const metrics = await this.httpClient.get('/api/v1/mcp/metrics');
      return {
        cpu_usage: metrics.cpu_usage,
        memory_usage: metrics.memory_usage,
        disk_usage: metrics.disk_usage,
        active_services: metrics.active_services,
        total_requests: metrics.total_requests,
        error_rate: metrics.error_rate,
        response_times: metrics.response_times,
        timestamp: metrics.timestamp
      };
    } catch (error) {
      throw new MCPError('Failed to fetch system metrics', 'METRICS_ERROR', { error });
    }
  }

  /**
   * Text-to-Speech conversion
   * @param {string} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<Object>} TTS result with audio URL
   */
  async textToSpeech(text, options = {}) {
    try {
      const result = await this.httpClient.post('/api/v1/mcp/tts', {
        text: text,
        voice: options.voice || 'default',
        speed: options.speed || 1.0,
        pitch: options.pitch || 1.0,
        format: options.format || 'mp3',
        timestamp: new Date().toISOString()
      });

      return {
        audio_url: result.audio_url,
        duration: result.duration,
        format: result.format,
        text: text,
        options: options
      };
    } catch (error) {
      throw new MCPError('Failed to convert text to speech', 'TTS_ERROR', { text, options, error });
    }
  }

  /**
   * Spawn AI agent for specific task
   * @param {string} agentType - Type of agent to spawn
   * @param {string} task - Task description
   * @param {AgentSpawnOptions} options - Spawn options
   * @returns {Promise<Object>} Agent spawn result
   */
  async spawnAgent(agentType, task, options = {}) {
    try {
      const result = await this.httpClient.post('/api/v1/mcp/agents/spawn', {
        agent_type: agentType,
        task: task,
        config: options.config || {},
        timeout: options.timeout || CONFIG.TIMEOUT,
        priority: options.priority || 'medium',
        timestamp: new Date().toISOString()
      });

      // Emit real-time event
      this.emit('agentSpawned', {
        agentId: result.agent_id,
        agentType,
        task,
        status: result.status,
        timestamp: new Date().toISOString()
      });

      return {
        agent_id: result.agent_id,
        status: result.status,
        estimated_completion: result.estimated_completion,
        progress_url: result.progress_url
      };
    } catch (error) {
      throw new MCPError(
        `Failed to spawn agent of type ${agentType}`,
        'AGENT_SPAWN_ERROR',
        { agentType, task, options, error }
      );
    }
  }

  /**
   * Get voice system status
   * @returns {Promise<Object>} Voice system status
   */
  async getVoiceStatus() {
    try {
      const status = await this.httpClient.get('/api/v1/mcp/voice/status');
      return {
        tts_available: status.tts_available,
        stt_available: status.stt_available,
        voice_providers: status.voice_providers,
        current_settings: status.current_settings,
        last_activity: status.last_activity
      };
    } catch (error) {
      throw new MCPError('Failed to fetch voice status', 'VOICE_STATUS_ERROR', { error });
    }
  }

  /**
   * Get service by ID
   * @param {string} serviceId - Service identifier
   * @returns {Promise<MCPService>} MCP service details
   */
  async getServiceById(serviceId) {
    try {
      const service = await this.httpClient.get(`/api/v1/mcp/services/${serviceId}`);
      return service;
    } catch (error) {
      throw new MCPError(`Failed to fetch service ${serviceId}`, 'GET_SERVICE_ERROR', { serviceId, error });
    }
  }

  /**
   * Get tool schema for a specific service
   * @param {string} serviceId - Service identifier
   * @param {string} toolName - Tool name
   * @returns {Promise<Object>} Tool schema
   */
  async getToolSchema(serviceId, toolName) {
    try {
      const schema = await this.httpClient.get(`/api/v1/mcp/services/${serviceId}/tools/${toolName}/schema`);
      return schema;
    } catch (error) {
      throw new MCPError(
        `Failed to fetch schema for tool ${toolName}`,
        'GET_TOOL_SCHEMA_ERROR',
        { serviceId, toolName, error }
      );
    }
  }

  /**
   * Get execution history
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} Execution history
   */
  async getExecutionHistory(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const history = await this.httpClient.get(`/api/v1/mcp/history?${params}`);
      return history;
    } catch (error) {
      throw new MCPError('Failed to fetch execution history', 'GET_HISTORY_ERROR', { filters, error });
    }
  }

  /**
   * Cleanup resources and close connections
   */
  cleanup() {
    if (this.wsManager) {
      this.wsManager.close();
      this.wsManager = null;
    }
    
    this.eventSubscriptions.clear();
    this.isInitialized = false;
    console.log('[MCP Services] Cleaned up successfully');
  }

  /**
   * Get connection status
   * @returns {Object} Connection status information
   */
  getConnectionStatus() {
    return {
      isInitialized: this.isInitialized,
      websocket: this.wsManager?.getStatus() || { isConnected: false },
      lastActivity: new Date().toISOString()
    };
  }
}

// Create singleton instance
const mcpServices = new MCPServices();

// Auto-initialize when module is loaded
let initPromise = null;

/**
 * Get initialized MCP services instance
 * @returns {Promise<MCPServices>} Initialized MCP services
 */
export const getMCPServices = async () => {
  if (!initPromise) {
    initPromise = mcpServices.initialize();
  }
  
  await initPromise;
  return mcpServices;
};

// Export individual methods for convenience
export const {
  getMCPServices: getServices,
  executeMCPTool: executeTool,
  getHealthStatus,
  getSystemMetrics,
  textToSpeech,
  spawnAgent,
  getVoiceStatus
} = mcpServices;

// Export classes for advanced usage
export { MCPServices, MCPError, WebSocketManager, HTTPClient };

// Export default instance
export default mcpServices;

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    mcpServices.cleanup();
  });
}
/**
 * KutiraAI MCP Services - Usage Examples
 * Demonstrates integration with React components
 * 
 * @description Examples showing how to use the MCP services in React components
 * with proper error handling, loading states, and real-time updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getMCPServices, 
  MCPError 
} from './mcp-services';

/**
 * Example: MCP Services Dashboard Component
 */
export const MCPServicesDashboard = () => {
  const [services, setServices] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mcpService, setMcpService] = useState(null);

  // Initialize MCP services
  useEffect(() => {
    const initializeMCP = async () => {
      try {
        const mcp = await getMCPServices();
        setMcpService(mcp);
        
        // Set up real-time event listeners
        mcp.subscribe('serviceStatusUpdate', handleServiceStatusUpdate);
        mcp.subscribe('systemMetricsUpdate', handleMetricsUpdate);
        mcp.subscribe('connectionError', handleConnectionError);
        
        // Load initial data
        await loadDashboardData(mcp);
        
      } catch (err) {
        console.error('Failed to initialize MCP services:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeMCP();

    // Cleanup on component unmount
    return () => {
      if (mcpService) {
        mcpService.unsubscribe('serviceStatusUpdate', handleServiceStatusUpdate);
        mcpService.unsubscribe('systemMetricsUpdate', handleMetricsUpdate);
        mcpService.unsubscribe('connectionError', handleConnectionError);
      }
    };
  }, []);

  /**
   * Load dashboard data
   */
  const loadDashboardData = async (mcp) => {
    try {
      const [servicesData, metricsData, healthData] = await Promise.all([
        mcp.getMCPServices(),
        mcp.getSystemMetrics(),
        mcp.getHealthStatus()
      ]);

      setServices(servicesData);
      setSystemMetrics(metricsData);
      setHealthStatus(healthData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message);
    }
  };

  /**
   * Handle real-time service status updates
   */
  const handleServiceStatusUpdate = useCallback((update) => {
    setServices(prevServices => 
      prevServices.map(service => 
        service.id === update.service_id 
          ? { ...service, status: update.status, lastUpdated: update.timestamp }
          : service
      )
    );
  }, []);

  /**
   * Handle real-time metrics updates
   */
  const handleMetricsUpdate = useCallback((metrics) => {
    setSystemMetrics(metrics);
  }, []);

  /**
   * Handle connection errors
   */
  const handleConnectionError = useCallback((error) => {
    console.error('MCP Connection Error:', error);
    setError(`Connection lost: ${error.message}`);
  }, []);

  /**
   * Refresh all data
   */
  const refreshData = async () => {
    if (!mcpService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await loadDashboardData(mcpService);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mcp-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Initializing MCP services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mcp-dashboard-error">
        <h3>Error Loading MCP Services</h3>
        <p>{error}</p>
        <button onClick={refreshData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="mcp-dashboard">
      <header className="dashboard-header">
        <h1>KutiraAI MCP Services Dashboard</h1>
        <button onClick={refreshData}>Refresh</button>
      </header>

      {/* System Metrics */}
      {systemMetrics && (
        <section className="system-metrics">
          <h2>System Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>CPU Usage</h3>
              <p>{systemMetrics.cpu_usage.toFixed(1)}%</p>
            </div>
            <div className="metric-card">
              <h3>Memory Usage</h3>
              <p>{systemMetrics.memory_usage.toFixed(1)}%</p>
            </div>
            <div className="metric-card">
              <h3>Active Services</h3>
              <p>{systemMetrics.active_services}</p>
            </div>
            <div className="metric-card">
              <h3>Error Rate</h3>
              <p>{systemMetrics.error_rate.toFixed(2)}%</p>
            </div>
          </div>
        </section>
      )}

      {/* Health Status */}
      {healthStatus && (
        <section className="health-status">
          <h2>Health Status</h2>
          <div className={`status-indicator ${healthStatus.overall_status}`}>
            {healthStatus.overall_status.toUpperCase()}
          </div>
          <p>Uptime: {Math.floor(healthStatus.uptime / 3600)} hours</p>
        </section>
      )}

      {/* Services List */}
      <section className="services-list">
        <h2>MCP Services ({services.length})</h2>
        <div className="services-grid">
          {services.map(service => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              mcpService={mcpService}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

/**
 * Example: Service Card Component
 */
const ServiceCard = ({ service, mcpService }) => {
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  /**
   * Execute a tool from this service
   */
  const executeTool = async (toolName, params = {}) => {
    setExecuting(true);
    try {
      const result = await mcpService.executeMCPTool(service.id, toolName, params);
      setLastResult(result);
      console.log(`Tool ${toolName} executed:`, result);
    } catch (error) {
      console.error(`Failed to execute tool ${toolName}:`, error);
      setLastResult({ error: error.message });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className={`service-card ${service.status}`}>
      <header className="service-header">
        <h3>{service.name}</h3>
        <div className={`status-badge ${service.status}`}>
          {service.status}
        </div>
      </header>
      
      <div className="service-info">
        <p>ID: {service.id}</p>
        <p>Tools: {service.tools.length}</p>
        <p>Version: {service.version || 'N/A'}</p>
      </div>

      {service.tools.length > 0 && (
        <div className="service-tools">
          <h4>Available Tools:</h4>
          <div className="tools-list">
            {service.tools.slice(0, 3).map(tool => (
              <button
                key={tool.name}
                onClick={() => executeTool(tool.name)}
                disabled={executing}
                className="tool-button"
              >
                {tool.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {lastResult && (
        <div className="last-result">
          <h4>Last Result:</h4>
          <pre>{JSON.stringify(lastResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

/**
 * Example: Text-to-Speech Component
 */
export const TTSDemo = () => {
  const [text, setText] = useState('Hello from KutiraAI!');
  const [isConverting, setIsConverting] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const convertToSpeech = async () => {
    if (!text.trim()) return;

    setIsConverting(true);
    setError(null);

    try {
      const mcp = await getMCPServices();
      const result = await mcp.textToSpeech(text, {
        voice: 'default',
        speed: 1.0,
        pitch: 1.0
      });

      setAudioUrl(result.audio_url);
    } catch (err) {
      console.error('TTS Error:', err);
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="tts-demo">
      <h3>Text-to-Speech Demo</h3>
      
      <div className="tts-input">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          rows={4}
          cols={50}
        />
      </div>

      <div className="tts-controls">
        <button 
          onClick={convertToSpeech} 
          disabled={isConverting || !text.trim()}
        >
          {isConverting ? 'Converting...' : 'Convert to Speech'}
        </button>
      </div>

      {error && (
        <div className="tts-error">
          Error: {error}
        </div>
      )}

      {audioUrl && (
        <div className="tts-result">
          <h4>Generated Audio:</h4>
          <audio controls src={audioUrl}>
            Your browser does not support audio playback.
          </audio>
        </div>
      )}
    </div>
  );
};

/**
 * Example: Agent Spawner Component
 */
export const AgentSpawner = () => {
  const [agentType, setAgentType] = useState('');
  const [task, setTask] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  const [spawnedAgents, setSpawnedAgents] = useState([]);
  const [error, setError] = useState(null);

  const agentTypes = [
    'data_analyst',
    'content_creator',
    'code_reviewer',
    'documentation_writer',
    'system_monitor'
  ];

  const spawnAgent = async () => {
    if (!agentType || !task.trim()) return;

    setIsSpawning(true);
    setError(null);

    try {
      const mcp = await getMCPServices();
      const result = await mcp.spawnAgent(agentType, task, {
        priority: 'medium',
        timeout: 300000 // 5 minutes
      });

      setSpawnedAgents(prev => [...prev, {
        ...result,
        agentType,
        task,
        spawnedAt: new Date().toISOString()
      }]);

      // Clear form
      setTask('');
    } catch (err) {
      console.error('Agent Spawn Error:', err);
      setError(err.message);
    } finally {
      setIsSpawning(false);
    }
  };

  return (
    <div className="agent-spawner">
      <h3>AI Agent Spawner</h3>
      
      <div className="spawn-form">
        <div className="form-group">
          <label htmlFor="agentType">Agent Type:</label>
          <select
            id="agentType"
            value={agentType}
            onChange={(e) => setAgentType(e.target.value)}
          >
            <option value="">Select agent type...</option>
            {agentTypes.map(type => (
              <option key={type} value={type}>
                {type.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task">Task Description:</label>
          <textarea
            id="task"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Describe the task for the agent..."
            rows={3}
          />
        </div>

        <button 
          onClick={spawnAgent} 
          disabled={isSpawning || !agentType || !task.trim()}
        >
          {isSpawning ? 'Spawning Agent...' : 'Spawn Agent'}
        </button>
      </div>

      {error && (
        <div className="spawn-error">
          Error: {error}
        </div>
      )}

      {spawnedAgents.length > 0 && (
        <div className="spawned-agents">
          <h4>Spawned Agents ({spawnedAgents.length}):</h4>
          {spawnedAgents.map((agent, index) => (
            <div key={index} className="agent-card">
              <h5>{agent.agentType}</h5>
              <p><strong>Task:</strong> {agent.task}</p>
              <p><strong>Agent ID:</strong> {agent.agent_id}</p>
              <p><strong>Status:</strong> {agent.status}</p>
              <p><strong>Spawned:</strong> {new Date(agent.spawnedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Example: Real-time Event Monitor
 */
export const EventMonitor = () => {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeEventMonitor = async () => {
      try {
        const mcp = await getMCPServices();
        
        // Subscribe to various events
        mcp.subscribe('serviceStatusUpdate', (event) => {
          addEvent('Service Status Update', event);
        });

        mcp.subscribe('agentSpawned', (event) => {
          addEvent('Agent Spawned', event);
        });

        mcp.subscribe('toolExecuted', (event) => {
          addEvent('Tool Executed', event);
        });

        mcp.subscribe('systemMetricsUpdate', (event) => {
          addEvent('System Metrics Update', event);
        });

        mcp.subscribe('realtimeEvent', (event) => {
          addEvent('Real-time Event', event);
        });

        setIsConnected(true);
      } catch (error) {
        console.error('Failed to initialize event monitor:', error);
      }
    };

    initializeEventMonitor();
  }, []);

  const addEvent = (type, data) => {
    setEvents(prev => [{
      id: Date.now() + Math.random(),
      type,
      data,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 49)]); // Keep only last 50 events
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="event-monitor">
      <header className="monitor-header">
        <h3>Real-time Event Monitor</h3>
        <div className="monitor-controls">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button onClick={clearEvents}>Clear Events</button>
        </div>
      </header>

      <div className="events-list">
        {events.length === 0 ? (
          <p>No events yet. Listening for real-time updates...</p>
        ) : (
          events.map(event => (
            <div key={event.id} className="event-item">
              <div className="event-header">
                <span className="event-type">{event.type}</span>
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="event-data">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Export all example components
export default {
  MCPServicesDashboard,
  TTSDemo,
  AgentSpawner,
  EventMonitor
};
/**
 * KutiraAI MCP Services Integration Guide
 * Quick integration examples for existing dashboard components
 */

// ============================================================================
// EXAMPLE 1: Adding MCP Services to Main Dashboard Component
// ============================================================================

// File: src/pages/dashboard/index.jsx (or similar)
import React, { useState, useEffect } from 'react';
import { getMCPServices } from '../api/mcp-services';

// Add to your existing dashboard component
const enhancedDashboardComponent = () => {
  const [mcpServices, setMcpServices] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [mcpHealthy, setMcpHealthy] = useState(true);

  useEffect(() => {
    const initializeMCPDashboard = async () => {
      try {
        const mcp = await getMCPServices();
        
        // Load MCP data
        const [services, metrics, health] = await Promise.all([
          mcp.getMCPServices(),
          mcp.getSystemMetrics(),
          mcp.getHealthStatus()
        ]);
        
        setMcpServices(services);
        setSystemMetrics(metrics);
        setMcpHealthy(health.overall_status === 'healthy');
        
        // Set up real-time monitoring
        mcp.subscribe('systemMetricsUpdate', (newMetrics) => {
          setSystemMetrics(newMetrics);
        });
        
        mcp.subscribe('serviceStatusUpdate', (update) => {
          setMcpServices(prev => 
            prev.map(service => 
              service.id === update.service_id 
                ? { ...service, status: update.status }
                : service
            )
          );
        });
        
      } catch (error) {
        console.error('MCP initialization failed:', error);
        setMcpHealthy(false);
      }
    };

    initializeMCPDashboard();
  }, []);

  // Add MCP status to your existing dashboard JSX
  return (
    <div>
      {/* Your existing dashboard content */}
      
      {/* Add MCP Status Section */}
      <div className="mcp-status-section">
        <h3>AI Services Status</h3>
        <div className={`health-indicator ${mcpHealthy ? 'healthy' : 'unhealthy'}`}>
          {mcpHealthy ? 'All Systems Operational' : 'Service Issues Detected'}
        </div>
        
        {systemMetrics && (
          <div className="quick-metrics">
            <span>CPU: {systemMetrics.cpu_usage.toFixed(1)}%</span>
            <span>Memory: {systemMetrics.memory_usage.toFixed(1)}%</span>
            <span>Services: {systemMetrics.active_services}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: MCP Widget Component for Dashboard Cards
// ============================================================================

import { Card, CardContent, Typography, Chip, Button } from '@mui/material';

const MCPServicesWidget = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMCPServices = async () => {
      try {
        const mcp = await getMCPServices();
        const servicesData = await mcp.getMCPServices();
        setServices(servicesData.slice(0, 5)); // Show top 5 services
      } catch (error) {
        console.error('Failed to load MCP services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMCPServices();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading AI Services...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Services ({services.length})
        </Typography>
        {services.map(service => (
          <div key={service.id} style={{ marginBottom: 8 }}>
            <Typography variant="body2">{service.name}</Typography>
            <Chip 
              size="small"
              label={service.status}
              color={service.status === 'active' ? 'success' : 'error'}
            />
          </div>
        ))}
        <Button size="small" onClick={() => window.location.href = '/mcp-dashboard'}>
          View All Services
        </Button>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXAMPLE 3: Adding Voice Features to Existing Components
// ============================================================================

const VoiceEnabledComponent = () => {
  const [isListening, setIsListening] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);

  useEffect(() => {
    const checkVoiceCapabilities = async () => {
      try {
        const mcp = await getMCPServices();
        const voiceStatus = await mcp.getVoiceStatus();
        setTtsAvailable(voiceStatus.tts_available);
      } catch (error) {
        console.error('Voice check failed:', error);
      }
    };

    checkVoiceCapabilities();
  }, []);

  const speakText = async (text) => {
    try {
      const mcp = await getMCPServices();
      const result = await mcp.textToSpeech(text);
      
      const audio = new Audio(result.audio_url);
      audio.play();
    } catch (error) {
      console.error('TTS failed:', error);
    }
  };

  return (
    <div>
      {/* Your existing component content */}
      
      {ttsAvailable && (
        <div className="voice-controls">
          <Button onClick={() => speakText('Welcome to KutiraAI Dashboard')}>
            🔊 Speak Welcome
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: Agent Spawning Integration
// ============================================================================

const AgentIntegrationExample = () => {
  const [agents, setAgents] = useState([]);
  
  const spawnDataAnalysisAgent = async (query) => {
    try {
      const mcp = await getMCPServices();
      const result = await mcp.spawnAgent('data_analyst', `Analyze: ${query}`, {
        priority: 'high',
        timeout: 300000
      });
      
      setAgents(prev => [...prev, {
        id: result.agent_id,
        type: 'data_analyst',
        query: query,
        status: result.status,
        spawnedAt: new Date()
      }]);
      
      // Show notification
      console.log('Data analysis agent spawned:', result.agent_id);
      
    } catch (error) {
      console.error('Agent spawn failed:', error);
    }
  };

  return (
    <div>
      <Button onClick={() => spawnDataAnalysisAgent('user engagement metrics')}>
        Analyze User Engagement
      </Button>
      
      <Button onClick={() => spawnDataAnalysisAgent('system performance trends')}>
        Analyze Performance
      </Button>
      
      {agents.length > 0 && (
        <div className="active-agents">
          <h4>Active Analysis Agents:</h4>
          {agents.map(agent => (
            <div key={agent.id} className="agent-card">
              <strong>{agent.type}</strong> - {agent.query}
              <br />
              <small>Status: {agent.status} | Spawned: {agent.spawnedAt.toLocaleTimeString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: Real-time System Monitoring Integration
// ============================================================================

const SystemMonitoringIntegration = () => {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const setupMonitoring = async () => {
      try {
        const mcp = await getMCPServices();
        
        // Get initial metrics
        const initialMetrics = await mcp.getSystemMetrics();
        setMetrics(initialMetrics);
        
        // Set up real-time monitoring
        mcp.subscribe('systemMetricsUpdate', (newMetrics) => {
          setMetrics(newMetrics);
          
          // Check for alerts
          if (newMetrics.cpu_usage > 80) {
            addAlert('High CPU usage detected: ' + newMetrics.cpu_usage.toFixed(1) + '%');
          }
          
          if (newMetrics.memory_usage > 85) {
            addAlert('High memory usage detected: ' + newMetrics.memory_usage.toFixed(1) + '%');
          }
          
          if (newMetrics.error_rate > 5) {
            addAlert('High error rate detected: ' + newMetrics.error_rate.toFixed(2) + '%');
          }
        });
        
        mcp.subscribe('systemAlert', (alert) => {
          addAlert(alert.message);
        });
        
      } catch (error) {
        console.error('Monitoring setup failed:', error);
      }
    };

    const addAlert = (message) => {
      setAlerts(prev => [{
        id: Date.now(),
        message,
        timestamp: new Date(),
        severity: 'warning'
      }, ...prev.slice(0, 9)]); // Keep last 10 alerts
    };

    setupMonitoring();
  }, []);

  return (
    <div className="system-monitoring">
      {metrics && (
        <div className="metrics-display">
          <div className="metric">
            <label>CPU:</label>
            <span className={metrics.cpu_usage > 80 ? 'high' : 'normal'}>
              {metrics.cpu_usage.toFixed(1)}%
            </span>
          </div>
          
          <div className="metric">
            <label>Memory:</label>
            <span className={metrics.memory_usage > 85 ? 'high' : 'normal'}>
              {metrics.memory_usage.toFixed(1)}%
            </span>
          </div>
          
          <div className="metric">
            <label>Services:</label>
            <span>{metrics.active_services}</span>
          </div>
          
          <div className="metric">
            <label>Error Rate:</label>
            <span className={metrics.error_rate > 5 ? 'high' : 'normal'}>
              {metrics.error_rate.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
      
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h4>System Alerts:</h4>
          {alerts.map(alert => (
            <div key={alert.id} className={`alert ${alert.severity}`}>
              <span>{alert.message}</span>
              <small>{alert.timestamp.toLocaleTimeString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CSS STYLES FOR INTEGRATION EXAMPLES
// ============================================================================

const integrationStyles = `
/* Add to your existing CSS or styled-components */

.mcp-status-section {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.health-indicator {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  margin: 8px 0;
}

.health-indicator.healthy {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.health-indicator.unhealthy {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.quick-metrics {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.quick-metrics span {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.voice-controls {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.active-agents {
  margin-top: 16px;
}

.agent-card {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
}

.system-monitoring {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}

.metrics-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.metric span.high {
  color: #dc3545;
  font-weight: bold;
}

.metric span.normal {
  color: #28a745;
}

.alerts-section {
  border-top: 1px solid #dee2e6;
  padding-top: 16px;
}

.alert {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 4px;
}

.alert.warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.alert small {
  margin-left: auto;
  opacity: 0.7;
}
`;

// ============================================================================
// EXPORT FOR EASY INTEGRATION
// ============================================================================

export {
  enhancedDashboardComponent,
  MCPServicesWidget,
  VoiceEnabledComponent,
  AgentIntegrationExample,
  SystemMonitoringIntegration,
  integrationStyles
};

// Usage instructions:
// 1. Import the components you need
// 2. Add them to your existing dashboard components
// 3. Add the CSS styles to your global styles or styled-components
// 4. Customize the components to match your design system

export default {
  enhancedDashboardComponent,
  MCPServicesWidget,
  VoiceEnabledComponent,
  AgentIntegrationExample,
  SystemMonitoringIntegration,
  integrationStyles
};
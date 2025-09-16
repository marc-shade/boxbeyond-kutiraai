# KutiraAI MCP Services API

A comprehensive, production-ready API service layer for connecting the KutiraAI dashboard frontend to the MCP (Model Control Protocol) backend system.

## Features

### 🚀 Core Capabilities
- **HTTP Client** with automatic retry logic and exponential backoff
- **WebSocket Manager** with auto-reconnection and heartbeat monitoring
- **Real-time Events** subscription system for live updates
- **Error Handling** with detailed error reporting and recovery
- **Type Safety** with comprehensive TypeScript-compatible JSDoc comments

### 🎯 MCP Service Methods
- `getMCPServices()` - Fetch all available MCP services
- `executeMCPTool(service, tool, params)` - Execute MCP tools with parameters
- `getHealthStatus()` - Get comprehensive health status of all services
- `getSystemMetrics()` - Retrieve real-time system performance metrics
- `textToSpeech(text, options)` - Convert text to speech audio
- `spawnAgent(type, task, options)` - Spawn AI agents for specific tasks
- `getVoiceStatus()` - Get voice system availability and settings

### 🔄 Real-time Features
- **WebSocket Events** for live system updates
- **Service Status Changes** monitoring
- **Agent Progress** tracking
- **System Metrics** real-time streaming
- **Tool Execution Results** immediate feedback

## Installation & Setup

### 1. Basic Usage

```javascript
import { getMCPServices } from './api/mcp-services';

// Initialize and use MCP services
const mcp = await getMCPServices();

// Get all available services
const services = await mcp.getMCPServices();

// Execute a tool
const result = await mcp.executeMCPTool('service-id', 'tool-name', {
  param1: 'value1',
  param2: 'value2'
});
```

### 2. React Component Integration

```jsx
import React, { useState, useEffect } from 'react';
import { getMCPServices } from './api/mcp-services';

const MyComponent = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeMCP = async () => {
      try {
        const mcp = await getMCPServices();
        
        // Load services
        const servicesData = await mcp.getMCPServices();
        setServices(servicesData);
        
        // Subscribe to real-time updates
        mcp.subscribe('serviceStatusUpdate', (update) => {
          console.log('Service status changed:', update);
        });
        
      } catch (error) {
        console.error('MCP initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMCP();
  }, []);

  return (
    <div>
      {loading ? (
        <div>Loading MCP services...</div>
      ) : (
        <div>
          <h2>Available Services: {services.length}</h2>
          {services.map(service => (
            <div key={service.id}>
              <h3>{service.name}</h3>
              <p>Status: {service.status}</p>
              <p>Tools: {service.tools.length}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. Advanced Features

#### Text-to-Speech Integration
```javascript
const mcp = await getMCPServices();

const ttsResult = await mcp.textToSpeech('Hello from KutiraAI!', {
  voice: 'default',
  speed: 1.0,
  pitch: 1.0,
  format: 'mp3'
});

// Play the generated audio
const audio = new Audio(ttsResult.audio_url);
audio.play();
```

#### Agent Spawning
```javascript
const mcp = await getMCPServices();

const agentResult = await mcp.spawnAgent('data_analyst', 'Analyze user engagement metrics', {
  config: {
    timeout: 300000,
    priority: 'high'
  }
});

console.log('Agent spawned:', agentResult.agent_id);
```

#### Real-time System Monitoring
```javascript
const mcp = await getMCPServices();

// Subscribe to system metrics updates
mcp.subscribe('systemMetricsUpdate', (metrics) => {
  console.log('CPU Usage:', metrics.cpu_usage + '%');
  console.log('Memory Usage:', metrics.memory_usage + '%');
  console.log('Active Services:', metrics.active_services);
});

// Get current metrics
const metrics = await mcp.getSystemMetrics();
```

## API Reference

### MCPServices Class

#### Methods

##### `getMCPServices(): Promise<MCPService[]>`
Retrieves all available MCP services with their current status and available tools.

**Returns:**
```typescript
{
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  tools: MCPTool[];
  metadata: object;
  lastUpdated: string;
  version: string;
}[]
```

##### `executeMCPTool(serviceId: string, toolName: string, params: object): Promise<any>`
Executes a specific tool on a given MCP service.

**Parameters:**
- `serviceId`: Unique identifier for the MCP service
- `toolName`: Name of the tool to execute
- `params`: Parameters to pass to the tool

**Returns:** Tool execution result (format varies by tool)

##### `getHealthStatus(): Promise<HealthStatus>`
Gets comprehensive health status of all MCP services and the system.

**Returns:**
```typescript
{
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  system_info: SystemInfo;
  last_check: string;
  uptime: number;
}
```

##### `getSystemMetrics(): Promise<SystemMetrics>`
Retrieves real-time system performance metrics.

**Returns:**
```typescript
{
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_services: number;
  total_requests: number;
  error_rate: number;
  response_times: ResponseTime[];
  timestamp: string;
}
```

##### `textToSpeech(text: string, options?: TTSOptions): Promise<TTSResult>`
Converts text to speech audio file.

**Parameters:**
- `text`: Text to convert to speech
- `options`: TTS configuration options

**Returns:**
```typescript
{
  audio_url: string;
  duration: number;
  format: string;
  text: string;
  options: TTSOptions;
}
```

##### `spawnAgent(agentType: string, task: string, options?: AgentSpawnOptions): Promise<AgentResult>`
Spawns an AI agent to perform a specific task.

**Parameters:**
- `agentType`: Type of agent to spawn
- `task`: Task description
- `options`: Agent configuration options

**Returns:**
```typescript
{
  agent_id: string;
  status: string;
  estimated_completion: string;
  progress_url: string;
}
```

##### `getVoiceStatus(): Promise<VoiceStatus>`
Gets the current status of the voice system (TTS/STT).

**Returns:**
```typescript
{
  tts_available: boolean;
  stt_available: boolean;
  voice_providers: string[];
  current_settings: VoiceSettings;
  last_activity: string;
}
```

### Event Subscription

#### Real-time Events

##### `serviceStatusUpdate`
Fired when a service status changes.
```typescript
{
  service_id: string;
  status: 'active' | 'inactive' | 'error';
  timestamp: string;
}
```

##### `systemMetricsUpdate`
Fired when system metrics are updated.
```typescript
{
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  // ... other metrics
}
```

##### `agentSpawned`
Fired when a new agent is spawned.
```typescript
{
  agent_id: string;
  agent_type: string;
  task: string;
  status: string;
  timestamp: string;
}
```

##### `toolExecuted`
Fired when a tool execution completes.
```typescript
{
  service_id: string;
  tool_name: string;
  params: object;
  result: any;
  timestamp: string;
}
```

## Error Handling

### MCPError Class
Custom error class for MCP-specific errors with detailed information.

```javascript
try {
  const result = await mcp.executeMCPTool('invalid-service', 'tool', {});
} catch (error) {
  if (error instanceof MCPError) {
    console.error('MCP Error:', error.code);
    console.error('Details:', error.details);
    console.error('Timestamp:', error.timestamp);
  }
}
```

### Common Error Codes
- `WEBSOCKET_ERROR` - WebSocket connection failed
- `HTTP_ERROR` - HTTP request failed
- `TIMEOUT_ERROR` - Request timed out
- `TOOL_EXECUTION_ERROR` - Tool execution failed
- `AGENT_SPAWN_ERROR` - Agent spawning failed
- `TTS_ERROR` - Text-to-speech conversion failed

## Configuration

### Default Configuration
```javascript
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
```

### Custom Configuration
You can override default configuration by modifying the CONFIG object before initializing services.

## Best Practices

### 1. Error Handling
Always wrap MCP calls in try-catch blocks:
```javascript
try {
  const result = await mcp.executeMCPTool(serviceId, toolName, params);
} catch (error) {
  console.error('Tool execution failed:', error);
  // Handle error appropriately
}
```

### 2. Resource Cleanup
Clean up subscriptions when components unmount:
```javascript
useEffect(() => {
  const mcp = getMCPServices();
  
  const handleUpdate = (data) => {
    // Handle update
  };
  
  mcp.subscribe('serviceStatusUpdate', handleUpdate);
  
  return () => {
    mcp.unsubscribe('serviceStatusUpdate', handleUpdate);
  };
}, []);
```

### 3. Loading States
Always show loading states for better UX:
```javascript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    const result = await mcp.executeMCPTool(serviceId, toolName, params);
    // Handle result
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
};
```

### 4. Real-time Updates
Use real-time events to keep UI synchronized:
```javascript
mcp.subscribe('systemMetricsUpdate', (metrics) => {
  setSystemMetrics(metrics);
});
```

## Integration with Material-UI

The service works seamlessly with Material-UI components used in the KutiraAI dashboard:

```jsx
import { Card, CardContent, CircularProgress, Alert } from '@mui/material';

const MCPServiceCard = ({ service }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{service.name}</Typography>
        <Chip 
          label={service.status} 
          color={service.status === 'active' ? 'success' : 'error'}
        />
        <Typography variant="body2">
          Tools: {service.tools.length}
        </Typography>
      </CardContent>
    </Card>
  );
};
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if the MCP backend is running on port 8000
   - Verify WebSocket endpoint is accessible
   - Check for firewall or proxy issues

2. **HTTP Requests Timeout**
   - Increase timeout in configuration
   - Check backend server response time
   - Verify network connectivity

3. **Service Not Found Errors**
   - Ensure MCP service is registered with backend
   - Check service ID spelling
   - Verify service is active and healthy

### Debug Mode
Enable detailed logging by setting:
```javascript
localStorage.setItem('mcp-debug', 'true');
```

## Contributing

1. Follow TypeScript-compatible JSDoc commenting
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update this README for new functionality
5. Maintain backward compatibility

## License

This MCP services API is part of the KutiraAI project and follows the project's licensing terms.
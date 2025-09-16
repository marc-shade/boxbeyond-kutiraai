import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tooltip,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Server,
  Activity,
  Mic,
  Speaker,
  Users,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Terminal,
  Bot,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { getMCPServices, getMCPMetrics, getMCPHealth, executeMCPTool } from '../../api/mcp-api';

const MCPDashboard = () => {
  const [services, setServices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [mcp, setMcp] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Initialize MCP service
  useEffect(() => {
    const initMCP = async () => {
      try {
        const mcpService = await getMCPServices();
        setMcp(mcpService);
        
        // Subscribe to real-time events
        mcpService.on('service_discovery', (data) => {
          setServices(data.services || []);
          setLastUpdate(new Date());
        });
        
        mcpService.on('health_update', (data) => {
          setHealth(data.health);
          setLastUpdate(new Date());
        });
        
        mcpService.on('metrics_update', (data) => {
          setMetrics(data.metrics);
          setLastUpdate(new Date());
        });
        
        mcpService.on('agent_update', (data) => {
          setAgents(data.agents || []);
        });
        
        mcpService.on('connected', () => setWsConnected(true));
        mcpService.on('disconnected', () => setWsConnected(false));
        
        // Load initial data
        await loadData(mcpService);
      } catch (err) {
        console.error('Failed to initialize MCP:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    initMCP();
    
    return () => {
      if (mcp) {
        mcp.disconnect();
      }
    };
  }, []);

  const loadData = async (mcpService) => {
    try {
      const [servicesData, healthData, metricsData, voiceData] = await Promise.all([
        mcpService.getMCPServices(),
        mcpService.getHealthStatus(),
        mcpService.getSystemMetrics(),
        mcpService.getVoiceStatus()
      ]);
      
      setServices(servicesData);
      setHealth(healthData);
      setMetrics(metricsData);
      setVoiceStatus(voiceData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load MCP data');
    }
  };

  const handleRefresh = async () => {
    if (mcp) {
      setLoading(true);
      await loadData(mcp);
      setLoading(false);
    }
  };

  const handleSpawnAgent = async (type) => {
    if (!mcp) return;
    
    try {
      const result = await mcp.spawnAgent(type, `Automated ${type} task`);
      console.log('Agent spawned:', result);
      // Refresh agents list
      const updatedAgents = [...agents, result];
      setAgents(updatedAgents);
    } catch (err) {
      console.error('Failed to spawn agent:', err);
      setError(`Failed to spawn ${type}: ${err.message}`);
    }
  };

  const handleTestVoice = async () => {
    if (!mcp) return;
    
    try {
      await mcp.textToSpeech('Hello! This is a test of the KutiraAI voice system.');
    } catch (err) {
      console.error('Voice test failed:', err);
      setError('Voice test failed: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'running':
      case 'active':
        return 'success';
      case 'warning':
      case 'degraded':
        return 'warning';
      case 'error':
      case 'failed':
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'running':
      case 'active':
        return <CheckCircle size={16} />;
      case 'warning':
      case 'degraded':
        return <AlertCircle size={16} />;
      case 'error':
      case 'failed':
      case 'unhealthy':
        return <XCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          MCP Services Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Chip
            icon={wsConnected ? <CheckCircle size={16} /> : <XCircle size={16} />}
            label={wsConnected ? 'Connected' : 'Disconnected'}
            color={wsConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            Last update: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={20} />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    MCP Services
                  </Typography>
                  <Typography variant="h4">
                    {services.length}
                  </Typography>
                </Box>
                <Server size={32} color="#8b5cf6" />
              </Box>
              <Box mt={1}>
                <Typography variant="caption" color="success.main">
                  {services.filter(s => s.status === 'healthy').length} healthy
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Agents
                  </Typography>
                  <Typography variant="h4">
                    {agents.length}
                  </Typography>
                </Box>
                <Bot size={32} color="#3b82f6" />
              </Box>
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  {agents.filter(a => a.status === 'running').length} running
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    System Health
                  </Typography>
                  <Typography variant="h4">
                    {health?.overall_health || 0}%
                  </Typography>
                </Box>
                <Activity size={32} color="#10b981" />
              </Box>
              <Box mt={1}>
                <LinearProgress 
                  variant="determinate" 
                  value={health?.overall_health || 0}
                  color={health?.overall_health > 80 ? 'success' : 'warning'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    API Latency
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.latency || 0}ms
                  </Typography>
                </Box>
                <Zap size={32} color="#eab308" />
              </Box>
              <Box mt={1}>
                <Typography variant="caption" color={metrics?.latency < 100 ? 'success.main' : 'warning.main'}>
                  {metrics?.latency < 100 ? 'Optimal' : 'Elevated'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Services List */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                MCP Services ({services.length})
              </Typography>
              <List dense>
                {services.slice(0, 8).map((service, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getStatusIcon(service.status)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={service.name}
                      secondary={`Port: ${service.port || 'N/A'} | Tools: ${service.tools?.length || 0}`}
                    />
                    <Chip
                      size="small"
                      label={service.status}
                      color={getStatusColor(service.status)}
                    />
                  </ListItem>
                ))}
              </List>
              {services.length > 8 && (
                <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                  And {services.length - 8} more services...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Metrics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <Cpu size={16} /> CPU Usage
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {metrics?.cpu_usage || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics?.cpu_usage || 0}
                    color={metrics?.cpu_usage < 70 ? 'primary' : 'warning'}
                  />
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <HardDrive size={16} /> Memory Usage
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {metrics?.memory_usage || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics?.memory_usage || 0}
                    color={metrics?.memory_usage < 80 ? 'success' : 'warning'}
                  />
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <Network size={16} /> Network I/O
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {metrics?.network_io || '0'} MB/s
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={45}
                    color="secondary"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Voice Interface */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Voice Interface
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" gap={2} mb={2}>
                  <Button
                    variant="contained"
                    startIcon={<Mic />}
                    onClick={handleTestVoice}
                    fullWidth
                  >
                    Test Voice System
                  </Button>
                </Box>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: <strong>{voiceStatus?.status || 'Unknown'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    TTS Provider: {voiceStatus?.tts_provider || 'Chatterbox'} (Port {voiceStatus?.tts_port || 8880})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    STT Provider: {voiceStatus?.stt_provider || 'Whisper'} (Port {voiceStatus?.stt_port || 2022})
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Agent Spawner */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Spawner
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  {['Backend Engineer', 'Frontend Specialist', 'System Architect', 'QA Engineer'].map(type => (
                    <Grid item xs={6} key={type}>
                      <Button
                        variant="outlined"
                        onClick={() => handleSpawnAgent(type)}
                        fullWidth
                        size="small"
                        startIcon={<Users size={16} />}
                      >
                        {type.split(' ')[0]}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
                {agents.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Active Agents: {agents.map(a => a.type).join(', ')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MCPDashboard;
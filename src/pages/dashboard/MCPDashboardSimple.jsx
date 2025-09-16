import React, { useState, useEffect } from 'react';
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
import { useTheme } from '@mui/material/styles';
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
import { voiceSystem, agentSpawning } from '../../services/mcp-integration';

const MCPDashboardSimple = () => {
  const theme = useTheme();
  const [services, setServices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load data on mount
  useEffect(() => {
    loadData();
    // Refresh data every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesData, metricsData, healthData] = await Promise.all([
        getMCPServices(),
        getMCPMetrics(),
        getMCPHealth()
      ]);
      
      setServices(servicesData);
      setMetrics(metricsData);
      setHealth(healthData);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleExecuteTool = async (service, tool) => {
    try {
      const result = await executeMCPTool(service, tool, {});
      console.log('Tool executed:', result);
      // Refresh data after execution
      loadData();
    } catch (err) {
      console.error('Failed to execute tool:', err);
      setError(`Failed to execute ${tool}: ${err.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
      case 'healthy':
        return <CheckCircle size={20} color="green" />;
      case 'stopped':
      case 'unhealthy':
        return <XCircle size={20} color="red" />;
      default:
        return <AlertCircle size={20} color="orange" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
      case 'healthy':
        return 'success';
      case 'stopped':
      case 'unhealthy':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading && !services.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          MCP Services Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshCw />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Server size={20} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Total Services
                </Typography>
              </Box>
              <Typography variant="h4">{services.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Activity size={20} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Active Services
                </Typography>
              </Box>
              <Typography variant="h4">
                {services.filter(s => s.status === 'running').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {metrics && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Cpu size={20} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      CPU Usage
                    </Typography>
                  </Box>
                  <Typography variant="h4">{Math.round(metrics.cpuUsage)}%</Typography>
                  <LinearProgress variant="determinate" value={metrics.cpuUsage} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <HardDrive size={20} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Memory Usage
                    </Typography>
                  </Box>
                  <Typography variant="h4">{Math.round(metrics.memoryUsage)}%</Typography>
                  <LinearProgress variant="determinate" value={metrics.memoryUsage} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Services List */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                MCP Services
              </Typography>
              <List>
                {services.map((service, index) => (
                  <ListItem
                    key={service.name}
                    sx={{
                      borderBottom: index < services.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                      py: 2
                    }}
                  >
                    <ListItemIcon>
                      {getStatusIcon(service.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {service.name}
                          </Typography>
                          <Chip
                            label={service.status}
                            size="small"
                            color={getStatusColor(service.status)}
                            variant="outlined"
                          />
                          {service.port && (
                            <Typography variant="body2" color="text.secondary">
                              Port: {service.port}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.secondary" display="block">
                            {service.description}
                          </Typography>
                          {service.tools && service.tools.length > 0 && (
                            <Box component="span" sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {service.tools.map(tool => (
                                <Chip
                                  key={tool}
                                  label={tool}
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleExecuteTool(service.name, tool)}
                                  sx={{ cursor: 'pointer' }}
                                />
                              ))}
                            </Box>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Voice & Agent Controls */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Voice System
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Mic />}
                  onClick={async () => {
                    const result = await voiceSystem.testSTT();
                    if (result.success) {
                      setError(null);
                      console.log('STT test successful:', result);
                    } else {
                      setError(`STT test failed: ${result.error}`);
                    }
                  }}
                >
                  Test STT
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Speaker />}
                  onClick={async () => {
                    const result = await voiceSystem.testTTS();
                    if (result.success) {
                      setError(null);
                      console.log('TTS test successful:', result);
                    } else {
                      setError(`TTS test failed: ${result.error}`);
                    }
                  }}
                >
                  Test TTS
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Agent Spawning
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Bot />}
                  onClick={async () => {
                    const result = await agentSpawning.spawnResearcher();
                    if (result.success) {
                      setError(null);
                      console.log('Researcher spawned:', result);
                      // Refresh data to show new agent
                      loadData();
                    } else {
                      setError(`Failed to spawn researcher: ${result.error}`);
                    }
                  }}
                >
                  Spawn Researcher
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Terminal />}
                  onClick={async () => {
                    const result = await agentSpawning.spawnCoder();
                    if (result.success) {
                      setError(null);
                      console.log('Coder spawned:', result);
                      // Refresh data to show new agent
                      loadData();
                    } else {
                      setError(`Failed to spawn coder: ${result.error}`);
                    }
                  }}
                >
                  Spawn Coder
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MCPDashboardSimple;
/**
 * Real MCP Dashboard Component
 * Uses actual MCP server connections instead of mock data
 */

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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Server,
  Activity,
  Mic,
  MicOff,
  Volume2,
  Users,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Terminal,
  Bot,
  Brain,
  Database,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import mcpConnector from '../services/real-mcp-connector';

const RealMCPDashboard = () => {
  const theme = useTheme();
  const [services, setServices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDialog, setVoiceDialog] = useState(false);
  const [agentDialog, setAgentDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [memoryDialog, setMemoryDialog] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Form states
  const [voiceText, setVoiceText] = useState('');
  const [agentType, setAgentType] = useState('coordinator');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [memoryQuery, setMemoryQuery] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
    // Refresh data every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get real services health
      const servicesData = await mcpConnector.getServicesHealth();
      setServices(servicesData);

      // Get real metrics
      const metricsData = await mcpConnector.getSystemMetrics();
      setMetrics(metricsData);

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  // Voice System Functions
  const handleTestSTT = async () => {
    setIsRecording(true);
    try {
      const result = await mcpConnector.testSTT();
      if (result.success) {
        showNotification('Speech to text completed: ' + (result.result?.text || 'No text captured'), 'success');
      } else {
        showNotification('STT failed: ' + result.error, 'error');
      }
    } catch (err) {
      showNotification('STT error: ' + err.message, 'error');
    } finally {
      setIsRecording(false);
    }
  };

  const handleTestTTS = async () => {
    if (!voiceText) {
      showNotification('Please enter text to speak', 'warning');
      return;
    }
    try {
      const result = await mcpConnector.testTTS(voiceText);
      if (result.success) {
        showNotification('Text to speech completed', 'success');
        setVoiceDialog(false);
        setVoiceText('');
      } else {
        showNotification('TTS failed: ' + result.error, 'error');
      }
    } catch (err) {
      showNotification('TTS error: ' + err.message, 'error');
    }
  };

  // Agent Spawning Function
  const handleSpawnAgent = async () => {
    if (!agentType) {
      showNotification('Please select an agent type', 'warning');
      return;
    }
    try {
      const capabilities = {
        coordinator: ['orchestration', 'delegation', 'monitoring'],
        analyst: ['data-analysis', 'reporting', 'insights'],
        optimizer: ['performance', 'efficiency', 'resource-management'],
        documenter: ['documentation', 'reporting', 'knowledge-base'],
        specialist: ['domain-expertise', 'problem-solving', 'research']
      };

      const result = await mcpConnector.spawnAgent(agentType, capabilities[agentType] || []);

      if (result.success) {
        showNotification(`Agent spawned successfully: ${result.result?.name || agentType}`, 'success');
        setAgentDialog(false);
        setAgentType('coordinator');
        loadData(); // Refresh to show new agent
      } else {
        showNotification('Agent spawn failed: ' + result.error, 'error');
      }
    } catch (err) {
      showNotification('Agent spawn error: ' + err.message, 'error');
    }
  };

  // Task Management Function
  const handleCreateTask = async () => {
    if (!taskTitle) {
      showNotification('Please enter a task title', 'warning');
      return;
    }
    try {
      const result = await mcpConnector.createTask(taskTitle, taskDescription, 'medium');

      if (result.success) {
        showNotification(`Task created: ${taskTitle}`, 'success');
        setTaskDialog(false);
        setTaskTitle('');
        setTaskDescription('');
        loadData(); // Refresh to show new task
      } else {
        showNotification('Task creation failed: ' + result.error, 'error');
      }
    } catch (err) {
      showNotification('Task creation error: ' + err.message, 'error');
    }
  };

  // Memory Search Function
  const handleMemorySearch = async () => {
    if (!memoryQuery) {
      showNotification('Please enter a search query', 'warning');
      return;
    }
    try {
      const result = await mcpConnector.searchMemory(memoryQuery, 10);

      if (result.success) {
        const count = result.result?.results?.length || 0;
        showNotification(`Found ${count} memory entries`, 'info');
        console.log('Memory search results:', result.result);
        setMemoryDialog(false);
        setMemoryQuery('');
      } else {
        showNotification('Memory search failed: ' + result.error, 'error');
      }
    } catch (err) {
      showNotification('Memory search error: ' + err.message, 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <CheckCircle color="success" size={20} />;
      case 'stopped':
        return <XCircle color="error" size={20} />;
      case 'warning':
        return <AlertCircle color="warning" size={20} />;
      default:
        return <AlertCircle color="disabled" size={20} />;
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy':
        return theme.palette.success.main;
      case 'unhealthy':
        return theme.palette.error.main;
      case 'degraded':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Real MCP Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={20} />
          </IconButton>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading Bar */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Services Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Server size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                MCP Services
              </Typography>
              <List>
                {services.map((service) => (
                  <ListItem key={service.name}>
                    <ListItemIcon>
                      {getStatusIcon(service.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={service.name}
                      secondary={`Port: ${service.port} | ${service.description}`}
                    />
                    <Chip
                      label={service.health}
                      size="small"
                      sx={{
                        backgroundColor: getHealthColor(service.health),
                        color: 'white'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Activity size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                System Metrics
              </Typography>
              {metrics && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Services</Typography>
                    <Typography variant="body2">
                      {metrics.services?.healthy}/{metrics.services?.total} Healthy
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Memory Entities</Typography>
                    <Typography variant="body2">
                      {metrics.memory?.entity_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Tasks</Typography>
                    <Typography variant="body2">
                      {metrics.tasks?.completed || 0}/{metrics.tasks?.total || 0} Complete
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Zap size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Quick Actions
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Voice System */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', cursor: 'pointer' }} elevation={2}>
                    <Typography variant="h6" gutterBottom>Voice System</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                      <Tooltip title="Speech to Text">
                        <IconButton
                          onClick={handleTestSTT}
                          color="primary"
                          disabled={isRecording}
                        >
                          {isRecording ? <CircularProgress size={24} /> : <Mic size={24} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Text to Speech">
                        <IconButton
                          onClick={() => setVoiceDialog(true)}
                          color="secondary"
                        >
                          <Volume2 size={24} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Grid>

                {/* Agent Spawning */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }} elevation={2}>
                    <Typography variant="h6" gutterBottom>Agent System</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Bot />}
                      onClick={() => setAgentDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Spawn Agent
                    </Button>
                  </Paper>
                </Grid>

                {/* Task Management */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }} elevation={2}>
                    <Typography variant="h6" gutterBottom>Task Manager</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Terminal />}
                      onClick={() => setTaskDialog(true)}
                      sx={{ mt: 2 }}
                      color="success"
                    >
                      Create Task
                    </Button>
                  </Paper>
                </Grid>

                {/* Memory System */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }} elevation={2}>
                    <Typography variant="h6" gutterBottom>Memory System</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Database />}
                      onClick={() => setMemoryDialog(true)}
                      sx={{ mt: 2 }}
                      color="info"
                    >
                      Search Memory
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Voice Dialog */}
      <Dialog open={voiceDialog} onClose={() => setVoiceDialog(false)}>
        <DialogTitle>Text to Speech</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Text to speak"
            fullWidth
            multiline
            rows={4}
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoiceDialog(false)}>Cancel</Button>
          <Button onClick={handleTestTTS} variant="contained">Speak</Button>
        </DialogActions>
      </Dialog>

      {/* Agent Dialog */}
      <Dialog open={agentDialog} onClose={() => setAgentDialog(false)}>
        <DialogTitle>Spawn New Agent</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Agent Type</InputLabel>
            <Select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              label="Agent Type"
            >
              <MenuItem value="coordinator">Coordinator</MenuItem>
              <MenuItem value="analyst">Analyst</MenuItem>
              <MenuItem value="optimizer">Optimizer</MenuItem>
              <MenuItem value="documenter">Documenter</MenuItem>
              <MenuItem value="specialist">Specialist</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgentDialog(false)}>Cancel</Button>
          <Button onClick={handleSpawnAgent} variant="contained">Spawn</Button>
        </DialogActions>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialog} onClose={() => setTaskDialog(false)}>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Memory Dialog */}
      <Dialog open={memoryDialog} onClose={() => setMemoryDialog(false)}>
        <DialogTitle>Search Memory</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search Query"
            fullWidth
            value={memoryQuery}
            onChange={(e) => setMemoryQuery(e.target.value)}
            variant="outlined"
            placeholder="Enter keywords to search..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemoryDialog(false)}>Cancel</Button>
          <Button onClick={handleMemorySearch} variant="contained">Search</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
      />
    </Box>
  );
};

export default RealMCPDashboard;
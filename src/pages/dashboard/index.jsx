// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';

// icons
import {
  PlayCircle as PlayIcon,
  Stop as StopIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  Memory as MemoryIcon,
  Mic as MicIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Hub as HubIcon,
  SmartToy as RobotIcon,
  SportsEsports as GameIcon,
  Store as StoreIcon,
  CloudQueue as CloudIcon,
  Terminal as TerminalIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// project import
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import UniqueVisitorCard from './UniqueVisitorCard';
import SystemHealth from './SystemHealth';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';
import PersonaLabDashboard from '../persona-lab/PersonaLabDashboard';

// API
import { dashboardAPI } from 'api/dashboard';
import { personaLabAPI } from 'api/persona-lab';
import { useState, useEffect } from 'react';

// ==============================|| DASHBOARD - DEFAULT ||============================== //

export default function DashboardDefault() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Real MCP server status
  const [mcpStatus, setMcpStatus] = useState({
    servers: {
      'claude-flow': { status: 'checking', tools: 8 },
      'enhanced-memory': { status: 'checking', tools: 5 },
      'voice-mode': { status: 'checking', tools: 12 },
      'ai-persona-lab': { status: 'checking', tools: 31 },
      'task-manager': { status: 'checking', tools: 9 },
      'confidence-orchestrator': { status: 'checking', tools: 4 }
    },
    totalActive: 0,
    totalAvailable: 573
  });

  // Flow Nexus status
  const [flowNexusStatus, setFlowNexusStatus] = useState({
    installed: true,
    version: '0.1.108',
    credits: 1000,
    challenges: { completed: 0, available: 15 },
    swarms: {
      research: { agents: 3, status: 'ready' },
      development: { agents: 4, status: 'ready' },
      creative: { agents: 2, status: 'ready' },
      quality: { agents: 4, status: 'ready' }
    }
  });

  // Real agent system status
  const [agentStatus, setAgentStatus] = useState({
    available: 153,
    categories: {
      'Core System': 7,
      'Implementation': 35,
      'BMAD Workflow': 12,
      'Quality & Security': 15,
      'Creative & Visual': 8,
      'Advanced AI': 18,
      'Tarot Archetypes': 22
    }
  });

  // Check real MCP server status
  const checkMCPServers = async () => {
    try {
      // Check AI Persona Lab backend
      const personaResponse = await fetch('http://localhost:9201/api/personas').catch(() => null);
      if (personaResponse && personaResponse.ok) {
        setMcpStatus(prev => ({
          ...prev,
          servers: {
            ...prev.servers,
            'ai-persona-lab': { status: 'active', tools: 31 }
          },
          totalActive: prev.totalActive + 1
        }));
      }

      // Check for MCP processes (this would need a real endpoint)
      const processes = await fetch('http://localhost:9201/api/system/mcp-status').catch(() => null);
      if (processes && processes.ok) {
        const data = await processes.json();
        setMcpStatus(prev => ({
          ...prev,
          totalActive: data.activeCount || 0
        }));
      }
    } catch (err) {
      console.log('MCP check:', err);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch main dashboard stats
        const response = await dashboardAPI.getStats();
        if (response) {
          setStats(response);
        }

        // Check MCP servers
        await checkMCPServers();

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(checkMCPServers, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const startMCPServer = async (serverName) => {
    console.log(`Starting MCP server: ${serverName}`);
    
    // Update UI to show starting status
    setMcpStatus(prev => ({
      ...prev,
      servers: {
        ...prev.servers,
        [serverName]: { ...prev.servers[serverName], status: 'starting' }
      }
    }));

    try {
      // Check if server is already active and stop it first
      const currentServer = mcpStatus.servers[serverName];
      let endpoint = `/api/mcp/servers/${serverName}/start`;
      
      if (currentServer?.status === 'active') {
        endpoint = `/api/mcp/servers/${serverName}/stop`;
      }
      
      const response = await fetch(`http://localhost:3002${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update status based on response
      setMcpStatus(prev => ({
        ...prev,
        servers: {
          ...prev.servers,
          [serverName]: { 
            ...prev.servers[serverName], 
            status: result.status || (currentServer?.status === 'active' ? 'inactive' : 'active')
          }
        }
      }));

      // Refresh all server status after operation
      setTimeout(fetchMCPStatus, 1000);
      
    } catch (error) {
      console.error(`Failed to control MCP server ${serverName}:`, error);
      setMcpStatus(prev => ({
        ...prev,
        servers: {
          ...prev.servers,
          [serverName]: { ...prev.servers[serverName], status: 'error' }
        }
      }));
    }
  };

  const launchFlowNexusMode = async (mode) => {
    console.log(`Launching Flow Nexus ${mode} mode`);
    
    try {
      const response = await fetch('http://localhost:3002/api/flow-nexus/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Flow Nexus ${mode} mode launched successfully:`, result);
      
      // Show success message or update UI state
      alert(`Flow Nexus ${mode} mode launched successfully!`);
      
    } catch (error) {
      console.error(`Failed to launch Flow Nexus ${mode} mode:`, error);
      alert(`Failed to launch Flow Nexus: ${error.message}`);
    }
  };

  const launchSwarm = async (swarmType) => {
    console.log(`Launching ${swarmType} swarm`);
    
    try {
      const response = await fetch('http://localhost:3002/api/swarm/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          swarmType, 
          task: `${swarmType} swarm for agentic system tasks` 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`${swarmType} swarm launched successfully:`, result);
      
      // Show success message with swarm details
      alert(`🚀 ${swarmType.toUpperCase()} Swarm Launched!\n\nSwarm ID: ${result.swarmId}\nAgents: ${result.agents.join(', ')}\nStatus: ${result.status}`);
      
    } catch (error) {
      console.error(`Failed to launch ${swarmType} swarm:`, error);
      alert(`Failed to launch ${swarmType} swarm: ${error.message}`);
    }
  };

  const viewAgentCategory = async (category) => {
    console.log(`Viewing ${category} agents`);
    
    try {
      const response = await fetch(`http://localhost:3002/api/agents/${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Create a formatted list of agents
      const agentList = result.agents.map(agent => `• ${agent.name}: ${agent.description}`).join('\n');
      
      const selectedAgent = prompt(`${category} Agents:\n\n${agentList}\n\nEnter the name of the agent you want to spawn (or click Cancel):`);
      
      if (selectedAgent) {
        const agent = result.agents.find(a => a.name.toLowerCase() === selectedAgent.toLowerCase());
        if (agent) {
          await spawnAgent(agent.name, category);
        } else {
          alert('Agent not found. Please enter the exact agent name.');
        }
      }
      
    } catch (error) {
      console.error(`Failed to get ${category} agents:`, error);
      alert(`Failed to load ${category} agents: ${error.message}`);
    }
  };

  const spawnAgent = async (agentName, category) => {
    console.log(`Spawning ${agentName} agent`);
    
    try {
      const task = prompt(`Enter a task for ${agentName} (or leave empty for default):`);
      
      const response = await fetch('http://localhost:3002/api/agent/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentName, 
          category,
          task: task || `${agentName} agent task`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`${agentName} spawned successfully:`, result);
      
      alert(`🤖 ${agentName} Spawned!\n\nAgent ID: ${result.agentId}\nTask: ${result.task}\nStatus: ${result.status}`);
      
    } catch (error) {
      console.error(`Failed to spawn ${agentName}:`, error);
      alert(`Failed to spawn ${agentName}: ${error.message}`);
    }
  };

  const getServerStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'starting':
        return <CircularProgress size={20} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      default:
        return <WarningIcon sx={{ color: 'text.disabled', fontSize: 20 }} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Header with tabs */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HubIcon sx={{ fontSize: 35 }} />
            Unified Agentic System
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
            <Tab label="Overview" />
            <Tab label="Persona Lab" />
            <Tab label="MCP Servers" />
            <Tab label="Flow Nexus" />
            <Tab label="Agent Library" />
          </Tabs>
        </Paper>
      </Grid>

      {activeTab === 0 && (
        <>
          {/* System Status Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <GlassmorphicCard>
              <AnalyticEcommerce
                title="MCP Servers"
                count={`${mcpStatus.totalActive}/${Object.keys(mcpStatus.servers).length}`}
                percentage={Math.round((mcpStatus.totalActive / Object.keys(mcpStatus.servers).length) * 100)}
                extra="Active servers"
                color="primary"
              />
            </GlassmorphicCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <GlassmorphicCard>
              <AnalyticEcommerce
                title="AI Agents"
                count={agentStatus.available.toString()}
                percentage={100}
                extra="Types available"
                color="secondary"
              />
            </GlassmorphicCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <GlassmorphicCard>
              <AnalyticEcommerce
                title="Flow Nexus"
                count={flowNexusStatus.credits.toString()}
                percentage={flowNexusStatus.credits / 50}
                extra="Credits available"
                color="success"
              />
            </GlassmorphicCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <GlassmorphicCard>
              <AnalyticEcommerce
                title="Personas"
                count={stats?.total_agents?.total?.toString() || "0"}
                percentage={stats?.total_agents?.active || 0}
                extra="AI personas created"
                color="warning"
              />
            </GlassmorphicCard>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <MainCard title="Quick Actions">
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<GroupsIcon />}
                  onClick={() => launchSwarm('development')}
                  color="primary"
                >
                  Launch Dev Swarm
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MicIcon />}
                  onClick={() => startMCPServer('voice-mode')}
                >
                  Activate Voice Mode
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GameIcon />}
                  onClick={() => launchFlowNexusMode('gamer')}
                >
                  Open Flow Nexus
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PsychologyIcon />}
                  onClick={() => setActiveTab(1)}
                >
                  Persona Lab
                </Button>
              </Stack>
            </MainCard>
          </Grid>

          {/* MCP Server Status */}
          <Grid item xs={12} md={4}>
            <MainCard title="MCP Server Status">
              <List dense>
                {Object.entries(mcpStatus.servers).map(([name, server]) => (
                  <ListItem key={name}>
                    <ListItemIcon>
                      {getServerStatusIcon(server.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={name}
                      secondary={`${server.tools} tools • ${server.status}`}
                    />
                    {server.status !== 'active' && (
                      <IconButton
                        size="small"
                        onClick={() => startMCPServer(name)}
                        disabled={server.status === 'starting'}
                      >
                        <PlayIcon />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </MainCard>
          </Grid>

          {/* Flow Nexus Status */}
          <Grid item xs={12} md={4}>
            <MainCard title="Flow Nexus">
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Version {flowNexusStatus.version}
                </Typography>
                <Typography variant="h6">
                  {flowNexusStatus.credits} Credits
                </Typography>
              </Box>
              <Typography variant="subtitle2" gutterBottom>
                Available Swarms:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.entries(flowNexusStatus.swarms).map(([type, swarm]) => (
                  <Chip
                    key={type}
                    label={`${type} (${swarm.agents})`}
                    size="small"
                    color={swarm.status === 'ready' ? 'success' : 'default'}
                    onClick={() => launchSwarm(type)}
                  />
                ))}
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Challenges: {flowNexusStatus.challenges.completed}/{flowNexusStatus.challenges.available}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(flowNexusStatus.challenges.completed / flowNexusStatus.challenges.available) * 100}
                  sx={{ mt: 1 }}
                />
              </Box>
            </MainCard>
          </Grid>

          {/* Original dashboard components */}
          <Grid item xs={12} md={7} lg={8}>
            <MainCard>
              <UniqueVisitorCard />
            </MainCard>
          </Grid>
          <Grid item xs={12} md={5} lg={4}>
            <MainCard>
              <SystemHealth />
            </MainCard>
          </Grid>
        </>
      )}

      {activeTab === 1 && (
        <Grid item xs={12}>
          <PersonaLabDashboard />
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid item xs={12}>
          <MainCard title="MCP Server Management">
            <Grid container spacing={3}>
              {Object.entries(mcpStatus.servers).map(([name, server]) => (
                <Grid item xs={12} md={4} key={name}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">{name}</Typography>
                        {getServerStatusIcon(server.status)}
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {server.tools} tools available
                      </Typography>
                      <Button
                        fullWidth
                        variant={server.status === 'active' ? 'outlined' : 'contained'}
                        color={server.status === 'active' ? 'error' : 'primary'}
                        startIcon={server.status === 'active' ? <StopIcon /> : <PlayIcon />}
                        onClick={() => startMCPServer(name)}
                        disabled={server.status === 'starting'}
                      >
                        {server.status === 'active' ? 'Stop' : 'Start'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </MainCard>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid item xs={12}>
          <MainCard title="Flow Nexus Integration">
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      <GameIcon sx={{ mr: 1 }} />
                      Gamer Mode
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Complete challenges to earn credits
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      onClick={() => launchFlowNexusMode('gamer')}
                    >
                      Start Challenges
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      <StoreIcon sx={{ mr: 1 }} />
                      Store Mode
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Browse templates and tools
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      onClick={() => launchFlowNexusMode('store')}
                    >
                      Open Store
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      <RobotIcon sx={{ mr: 1 }} />
                      Swarm Mode
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Deploy AI agent teams
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      onClick={() => launchFlowNexusMode('swarm')}
                    >
                      Manage Swarms
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid item xs={12}>
          <MainCard title="AI Agent Library (153 Types)">
            <Grid container spacing={2}>
              {Object.entries(agentStatus.categories).map(([category, count]) => (
                <Grid item xs={12} md={6} key={category}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => viewAgentCategory(category)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {category} ({count} agents)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click to view and spawn agents in this category
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </MainCard>
        </Grid>
      )}
    </Grid>
  );
}
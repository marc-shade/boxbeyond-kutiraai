import { useState, useEffect, useRef } from 'react';

// material-ui
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Alert,
  Grid,
  Divider,
  Paper
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Psychology as PsychologyIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// project import
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';
import { personaLabMCP } from 'utils/mcpIntegration';

// ==============================|| EXPERIMENT MONITOR ||============================== //

export default function ExperimentMonitor({ experiments = [], onExperimentUpdate }) {
  const [expandedExperiments, setExpandedExperiments] = useState(new Set());
  const [experimentStatus, setExperimentStatus] = useState(new Map());
  const [realTimeData, setRealTimeData] = useState(new Map());
  const intervalRef = useRef(null);

  // Filter only running experiments
  const runningExperiments = experiments.filter(exp => exp.status === 'running');

  useEffect(() => {
    if (runningExperiments.length > 0) {
      // Start real-time monitoring
      intervalRef.current = setInterval(async () => {
        for (const experiment of runningExperiments) {
          try {
            // Simulate fetching real-time experiment data
            const status = await fetchExperimentStatus(experiment.id);
            setExperimentStatus(prev => new Map(prev.set(experiment.id, status)));
            
            // Simulate real-time metrics
            const metrics = await fetchRealTimeMetrics(experiment.id);
            setRealTimeData(prev => new Map(prev.set(experiment.id, metrics)));
          } catch (error) {
            console.error(`Error monitoring experiment ${experiment.id}:`, error);
          }
        }
      }, 2000); // Update every 2 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [runningExperiments.length]);

  const fetchExperimentStatus = async (experimentId) => {
    // Simulate real-time status fetching
    const statuses = [
      {
        phase: 'Agent Spawning',
        progress: Math.min(100, Math.random() * 30 + 70),
        agentsActive: Math.floor(Math.random() * 3) + 2,
        totalAgents: 5,
        currentActivity: 'Initializing persona agents...'
      },
      {
        phase: 'Scenario Execution',
        progress: Math.min(100, Math.random() * 40 + 30),
        agentsActive: 5,
        totalAgents: 5,
        currentActivity: 'Running test scenarios across personas...'
      },
      {
        phase: 'Response Collection',
        progress: Math.min(100, Math.random() * 30 + 60),
        agentsActive: 5,
        totalAgents: 5,
        currentActivity: 'Collecting and analyzing persona responses...'
      }
    ];
    
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const fetchRealTimeMetrics = async (experimentId) => {
    // Simulate real-time metrics
    return {
      responsesCollected: Math.floor(Math.random() * 12) + 5,
      avgEngagement: (Math.random() * 3 + 7).toFixed(1),
      sentimentBreakdown: {
        positive: Math.floor(Math.random() * 60) + 30,
        neutral: Math.floor(Math.random() * 30) + 10,
        negative: Math.floor(Math.random() * 20) + 5
      },
      activePersonas: [
        'Sarah Chen', 'Marcus Johnson', 'Elena Rodriguez'
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      estimatedCompletion: `${Math.floor(Math.random() * 5) + 2} minutes`
    };
  };

  const handleToggleExpand = (experimentId) => {
    setExpandedExperiments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(experimentId)) {
        newSet.delete(experimentId);
      } else {
        newSet.add(experimentId);
      }
      return newSet;
    });
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'Agent Spawning': return <PsychologyIcon />;
      case 'Scenario Execution': return <PlayArrowIcon />;
      case 'Response Collection': return <TrendingUpIcon />;
      default: return <TimerIcon />;
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'Agent Spawning': return 'info';
      case 'Scenario Execution': return 'warning';
      case 'Response Collection': return 'success';
      default: return 'default';
    }
  };

  if (runningExperiments.length === 0) {
    return (
      <GlassmorphicCard>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: 'grey.400' }}>
              <TimerIcon />
            </Avatar>
            <Typography variant="h6">Experiment Monitor</Typography>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            No experiments are currently running. Start an experiment to see real-time monitoring.
          </Alert>
        </CardContent>
      </GlassmorphicCard>
    );
  }

  return (
    <GlassmorphicCard>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <TimerIcon />
          </Avatar>
          <Typography variant="h6">
            Real-Time Experiment Monitor
          </Typography>
          <Chip 
            label={`${runningExperiments.length} Active`}
            color="success"
            size="small"
          />
        </Box>

        <List>
          {runningExperiments.map((experiment) => {
            const status = experimentStatus.get(experiment.id);
            const metrics = realTimeData.get(experiment.id);
            const isExpanded = expandedExperiments.has(experiment.id);

            return (
              <Card key={experiment.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ pb: 1 }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: status ? getPhaseColor(status.phase) + '.main' : 'grey.400' }}>
                        {status ? getPhaseIcon(status.phase) : <TimerIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {experiment.name}
                          </Typography>
                          <Chip 
                            label="LIVE"
                            color="error"
                            size="small"
                            sx={{ 
                              animation: 'pulse 2s infinite',
                              '@keyframes pulse': {
                                '0%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                                '100%': { opacity: 1 }
                              }
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {status?.currentActivity || 'Initializing experiment...'}
                          </Typography>
                          {status && (
                            <Box mt={1}>
                              <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption">
                                  {status.phase} - {status.progress.toFixed(0)}%
                                </Typography>
                                <Typography variant="caption">
                                  {status.agentsActive}/{status.totalAgents} agents active
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={status.progress}
                                color={getPhaseColor(status.phase)}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleToggleExpand(experiment.id)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 2 }} />
                    {metrics && (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                              {metrics.responsesCollected}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Responses Collected
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="secondary">
                              {metrics.avgEngagement}/10
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Avg Engagement
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="success.main">
                              {metrics.sentimentBreakdown.positive}%
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Positive Sentiment
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="info.main">
                              {metrics.estimatedCompletion}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Est. Completion
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Box mt={1}>
                            <Typography variant="subtitle2" gutterBottom>
                              Active Personas:
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              {metrics.activePersonas.map((persona, index) => (
                                <Chip
                                  key={index}
                                  label={persona}
                                  size="small"
                                  color="primary"
                                  avatar={<Avatar sx={{ width: 20, height: 20 }}><GroupIcon fontSize="small" /></Avatar>}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <Box mt={1}>
                            <Typography variant="subtitle2" gutterBottom>
                              Sentiment Distribution:
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={4}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                  <Typography variant="caption">
                                    Positive: {metrics.sentimentBreakdown.positive}%
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <WarningIcon color="warning" fontSize="small" />
                                  <Typography variant="caption">
                                    Neutral: {metrics.sentimentBreakdown.neutral}%
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <ErrorIcon color="error" fontSize="small" />
                                  <Typography variant="caption">
                                    Negative: {metrics.sentimentBreakdown.negative}%
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        </Grid>
                      </Grid>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </List>
      </CardContent>
    </GlassmorphicCard>
  );
}
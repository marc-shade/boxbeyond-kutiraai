import { useState, useEffect } from 'react';

// material-ui
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  IconButton,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  InsertChart as InsertChartIcon,
  Lightbulb as LightbulbIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

// project import
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';
import { personaLabAPI } from 'api/persona-lab';

// ==============================|| EXPERIMENT RESULTS MODAL ||============================== //

export default function ExperimentResultsModal({ open, onClose, experiment = null }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (open && experiment?.id) {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch experiment results
          const response = await personaLabAPI.getExperimentResults(experiment.id);
          if (response.success) {
            setResults(response.results);
          } else {
            throw new Error('Failed to load results');
          }
        } catch (err) {
          console.error('Error fetching results:', err);
          setError('Failed to load experiment results');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchResults();
  }, [open, experiment]);

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'neutral': return 'default';
      case 'curious': return 'info';
      case 'optimistic': return 'success';
      case 'interested': return 'primary';
      default: return 'default';
    }
  };

  const getEngagementLevel = (score) => {
    if (score >= 8) return { level: 'High', color: 'success' };
    if (score >= 6) return { level: 'Medium', color: 'warning' };
    return { level: 'Low', color: 'error' };
  };

  if (!experiment) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '90vh',
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <InsertChartIcon />
          </Avatar>
          <Box>
            <Typography variant="h5">
              Experiment Results
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {experiment.name}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Box textAlign="center">
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Analyzing Experiment Results...
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Processing AI agent responses and generating insights
              </Typography>
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {results && !loading && (
          <Grid container spacing={3}>
            {/* Executive Summary */}
            <Grid item xs={12}>
              <GlassmorphicCard>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Typography variant="h6">Executive Summary</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {results.analysis?.overall_sentiment || 'Positive'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Overall Sentiment
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="secondary">
                          {results.analysis?.engagement_score || 8.0}/10
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Engagement Score
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {results.scenario_responses?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Scenarios Tested
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {experiment.persona_count || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Personas Engaged
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </GlassmorphicCard>
            </Grid>

            {/* Persona Responses */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <GroupsIcon />
                    </Avatar>
                    <Typography variant="h6">Persona Responses</Typography>
                  </Box>
                  
                  {results.scenario_responses?.map((scenario, scenarioIndex) => (
                    <Accordion key={scenarioIndex} defaultExpanded={scenarioIndex === 0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {scenario.scenario}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {scenario.responses?.map((response, responseIndex) => (
                            <Grid item xs={12} md={6} key={responseIndex}>
                              <Card variant="outlined" sx={{ height: '100%' }}>
                                <CardContent>
                                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Avatar sx={{ bgcolor: 'info.main' }}>
                                      <PersonIcon />
                                    </Avatar>
                                    <Box flex={1}>
                                      <Typography variant="subtitle2">
                                        {response.persona}
                                      </Typography>
                                      <Box display="flex" gap={1} mt={1}>
                                        <Chip 
                                          label={response.sentiment} 
                                          color={getSentimentColor(response.sentiment)}
                                          size="small"
                                        />
                                        <Chip 
                                          label={`${getEngagementLevel(response.engagement).level} Engagement`}
                                          color={getEngagementLevel(response.engagement).color}
                                          size="small"
                                        />
                                      </Box>
                                    </Box>
                                    <Typography variant="h6" color="primary">
                                      {response.engagement}/10
                                    </Typography>
                                  </Box>
                                  
                                  <Box mb={2}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                      Engagement Score
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={response.engagement * 10} 
                                      color={getEngagementLevel(response.engagement).color}
                                      sx={{ height: 8, borderRadius: 4 }}
                                    />
                                  </Box>

                                  {response.key_points && (
                                    <Box>
                                      <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Key Points:
                                      </Typography>
                                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                                        {response.key_points.map((point, pointIndex) => (
                                          <Chip 
                                            key={pointIndex}
                                            label={point}
                                            size="small"
                                            variant="outlined"
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Key Insights */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <LightbulbIcon />
                    </Avatar>
                    <Typography variant="h6">Key Insights</Typography>
                  </Box>
                  <List>
                    {results.analysis?.key_insights?.map((insight, index) => (
                      <ListItem key={index} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            <StarIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={insight}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recommendations */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircleIcon />
                    </Avatar>
                    <Typography variant="h6">Recommendations</Typography>
                  </Box>
                  <List>
                    {results.analysis?.recommendations?.map((recommendation, index) => (
                      <ListItem key={index} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                            <Typography variant="caption" fontWeight="bold">
                              {index + 1}
                            </Typography>
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={recommendation}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Experiment Timeline */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <ScheduleIcon />
                    </Avatar>
                    <Typography variant="h6">Experiment Timeline</Typography>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Phase</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Participants</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Setup & Agent Spawning</TableCell>
                          <TableCell>30 seconds</TableCell>
                          <TableCell>{experiment.persona_count} AI Agents</TableCell>
                          <TableCell>
                            <Chip label="Completed" color="success" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Scenario Execution</TableCell>
                          <TableCell>5-8 minutes</TableCell>
                          <TableCell>{results.scenario_responses?.length || 0} Scenarios</TableCell>
                          <TableCell>
                            <Chip label="Completed" color="success" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Response Analysis</TableCell>
                          <TableCell>2-3 minutes</TableCell>
                          <TableCell>AI Analysis Engine</TableCell>
                          <TableCell>
                            <Chip label="Completed" color="success" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Insight Generation</TableCell>
                          <TableCell>1-2 minutes</TableCell>
                          <TableCell>Strategic AI</TableCell>
                          <TableCell>
                            <Chip label="Completed" color="success" size="small" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button variant="contained" color="primary">
          Export Results
        </Button>
        <Button variant="contained" color="secondary">
          Run Similar Experiment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
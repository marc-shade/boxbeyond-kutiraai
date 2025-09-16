import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Psychology as PsychologyIcon,
  Insights as InsightsIcon,
  BubbleChart as BubbleChartIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  AutoGraph as AutoGraphIcon,
  Analytics as AnalyticsIcon,
  CompareArrows as CompareArrowsIcon,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

// ==============================|| PERSONA ANALYTICS ||============================== //

export default function PersonaAnalytics({ personas = [], experiments = [] }) {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (personas.length > 0) {
      generateAnalyticsData();
    }
  }, [personas, experiments, timeRange]);

  const generateAnalyticsData = () => {
    setLoading(true);
    
    // Simulate analytics data generation
    setTimeout(() => {
      const data = {
        engagementTrends: generateEngagementTrends(),
        personaDistribution: generatePersonaDistribution(),
        behaviorPatterns: generateBehaviorPatterns(),
        sentimentAnalysis: generateSentimentAnalysis(),
        conversionMetrics: generateConversionMetrics(),
        topPerformers: getTopPerformingPersonas(),
        insights: generateInsights()
      };
      
      setAnalyticsData(data);
      setLoading(false);
    }, 1000);
  };

  const generateEngagementTrends = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      day: `Day ${i + 1}`,
      engagement: Math.floor(Math.random() * 30) + 70,
      responses: Math.floor(Math.random() * 50) + 20,
      interactions: Math.floor(Math.random() * 40) + 30
    }));
  };

  const generatePersonaDistribution = () => {
    const types = ['Tech Early Adopter', 'Price Conscious', 'Feature Focused', 'Brand Loyal', 'Innovator'];
    return types.map(type => ({
      name: type,
      value: Math.floor(Math.random() * 30) + 10,
      percentage: Math.floor(Math.random() * 25) + 10
    }));
  };

  const generateBehaviorPatterns = () => {
    return [
      { behavior: 'Research', Tech: 85, Traditional: 45, Millennial: 70, GenZ: 90 },
      { behavior: 'Purchase', Tech: 70, Traditional: 60, Millennial: 75, GenZ: 65 },
      { behavior: 'Engage', Tech: 80, Traditional: 40, Millennial: 85, GenZ: 95 },
      { behavior: 'Share', Tech: 60, Traditional: 30, Millennial: 70, GenZ: 85 },
      { behavior: 'Return', Tech: 50, Traditional: 55, Millennial: 45, GenZ: 40 }
    ];
  };

  const generateSentimentAnalysis = () => {
    return {
      positive: Math.floor(Math.random() * 30) + 50,
      neutral: Math.floor(Math.random() * 20) + 20,
      negative: Math.floor(Math.random() * 15) + 5
    };
  };

  const generateConversionMetrics = () => {
    return [
      { stage: 'Awareness', rate: 100, color: '#8884d8' },
      { stage: 'Interest', rate: 75, color: '#83a6ed' },
      { stage: 'Consideration', rate: 50, color: '#8dd1e1' },
      { stage: 'Intent', rate: 35, color: '#82ca9d' },
      { stage: 'Purchase', rate: 20, color: '#a4de6c' },
      { stage: 'Loyalty', rate: 15, color: '#ffc658' }
    ];
  };

  const getTopPerformingPersonas = () => {
    return personas.slice(0, 5).map(persona => ({
      ...persona,
      score: Math.floor(Math.random() * 30) + 70,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: Math.floor(Math.random() * 15) + 5
    }));
  };

  const generateInsights = () => {
    return [
      {
        type: 'success',
        title: 'High Engagement Pattern Detected',
        description: 'Tech Early Adopters show 35% higher engagement with AI-powered features',
        impact: 'high'
      },
      {
        type: 'warning',
        title: 'Price Sensitivity Alert',
        description: 'Price Conscious segment shows resistance above $99 price point',
        impact: 'medium'
      },
      {
        type: 'info',
        title: 'Opportunity Identified',
        description: 'Millennials respond 2x better to social proof messaging',
        impact: 'high'
      },
      {
        type: 'success',
        title: 'Conversion Optimization',
        description: 'Personalized demos increase conversion by 45% for Enterprise personas',
        impact: 'high'
      }
    ];
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <GlassmorphicCard>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Box textAlign="center">
              <AnalyticsIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6">Generating Analytics...</Typography>
              <LinearProgress sx={{ mt: 2, width: 200 }} />
            </Box>
          </Box>
        </CardContent>
      </GlassmorphicCard>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Header Stats */}
      <Grid item xs={12}>
        <GlassmorphicCard>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <AnalyticsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Persona Analytics Dashboard
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Comprehensive insights across {personas.length} personas
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <Chip
                  label={timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : '90 Days'}
                  color="primary"
                  onClick={() => {
                    const ranges = ['7d', '30d', '90d'];
                    const currentIndex = ranges.indexOf(timeRange);
                    setTimeRange(ranges[(currentIndex + 1) % ranges.length]);
                  }}
                />
                <IconButton>
                  <DownloadIcon />
                </IconButton>
                <IconButton>
                  <ShareIcon />
                </IconButton>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {personas.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Personas
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {experiments.filter(e => e.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed Experiments
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    85%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Engagement Rate
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {analyticsData?.insights.length || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Key Insights
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      {/* Engagement Trends */}
      <Grid item xs={12} lg={8}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Engagement Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.engagementTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Engagement %" 
                />
                <Line 
                  type="monotone" 
                  dataKey="responses" 
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Responses" 
                />
                <Line 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="#ffc658"
                  strokeWidth={2}
                  name="Interactions" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      {/* Persona Distribution */}
      <Grid item xs={12} lg={4}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Persona Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.personaDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(analyticsData?.personaDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      {/* Behavior Patterns */}
      <Grid item xs={12} lg={6}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Behavior Patterns by Segment
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={analyticsData?.behaviorPatterns || []}>
                <PolarGrid />
                <PolarAngleAxis dataKey="behavior" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Tech" dataKey="Tech" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Traditional" dataKey="Traditional" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Radar name="Millennial" dataKey="Millennial" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                <Radar name="GenZ" dataKey="GenZ" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      {/* Conversion Funnel */}
      <Grid item xs={12} lg={6}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Conversion Funnel
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.conversionMetrics || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="rate" fill="#8884d8">
                  {(analyticsData?.conversionMetrics || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      {/* Top Performing Personas */}
      <Grid item xs={12} lg={6}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Performing Personas
            </Typography>
            <List>
              {analyticsData?.topPerformers.map((persona, index) => (
                <ListItem key={persona.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${COLORS[index % COLORS.length]}` }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={persona.name}
                    secondary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption">
                          Score: {persona.score}%
                        </Typography>
                        <Box display="flex" alignItems="center">
                          {persona.trend === 'up' ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : (
                            <TrendingDownIcon color="error" fontSize="small" />
                          )}
                          <Typography variant="caption" color={persona.trend === 'up' ? 'success.main' : 'error.main'}>
                            {persona.change}%
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={persona.demographic}
                      size="small"
                      variant="outlined"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      {/* Key Insights */}
      <Grid item xs={12} lg={6}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Key Insights
            </Typography>
            <List>
              {analyticsData?.insights.map((insight, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: insight.type === 'success' ? 'success.light' : 
                               insight.type === 'warning' ? 'warning.light' : 'info.light' 
                    }}>
                      <InsightsIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={insight.title}
                    secondary={insight.description}
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={insight.impact.toUpperCase()}
                      size="small"
                      color={insight.impact === 'high' ? 'error' : 'default'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </GlassmorphicCard>
      </Grid>
    </Grid>
  );
}
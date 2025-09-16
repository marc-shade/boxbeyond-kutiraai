import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Science as ScienceIcon,
  Psychology as PsychologyIcon,
  Campaign as CampaignIcon,
  ShoppingCart as ShoppingCartIcon,
  Email as EmailIcon,
  Web as WebIcon,
  PhoneAndroid as MobileIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';

// ==============================|| EXPERIMENT TEMPLATES ||============================== //

const experimentTemplates = [
  {
    id: 'price-sensitivity',
    category: 'Pricing',
    name: 'Price Sensitivity Analysis',
    description: 'Test how different personas respond to various price points and discount strategies',
    icon: <ShoppingCartIcon />,
    duration: '2-3 hours',
    difficulty: 'Medium',
    requiredPersonas: 3,
    scenarios: [
      'Premium pricing presentation',
      'Discount offer comparison',
      'Value proposition testing',
      'Subscription vs one-time payment'
    ],
    metrics: ['Conversion rate', 'Price elasticity', 'Purchase intent', 'Value perception'],
    color: 'success'
  },
  {
    id: 'messaging-effectiveness',
    category: 'Marketing',
    name: 'Messaging Effectiveness Test',
    description: 'Evaluate which marketing messages resonate best with different audience segments',
    icon: <CampaignIcon />,
    duration: '1-2 hours',
    difficulty: 'Easy',
    requiredPersonas: 4,
    scenarios: [
      'Feature-focused messaging',
      'Benefit-driven messaging',
      'Social proof emphasis',
      'Urgency and scarcity tactics'
    ],
    metrics: ['Engagement rate', 'Message clarity', 'Emotional response', 'Call-to-action effectiveness'],
    color: 'primary'
  },
  {
    id: 'ux-usability',
    category: 'Product',
    name: 'UX/UI Usability Study',
    description: 'Test user interface designs and navigation flows with diverse user personas',
    icon: <WebIcon />,
    duration: '3-4 hours',
    difficulty: 'Hard',
    requiredPersonas: 5,
    scenarios: [
      'Onboarding flow evaluation',
      'Feature discovery test',
      'Navigation pattern analysis',
      'Error recovery assessment'
    ],
    metrics: ['Task completion rate', 'Time to complete', 'Error frequency', 'User satisfaction'],
    color: 'info'
  },
  {
    id: 'email-campaign',
    category: 'Marketing',
    name: 'Email Campaign Optimization',
    description: 'Test subject lines, content, and CTAs for email marketing campaigns',
    icon: <EmailIcon />,
    duration: '1 hour',
    difficulty: 'Easy',
    requiredPersonas: 3,
    scenarios: [
      'Subject line A/B testing',
      'Content personalization',
      'CTA button variations',
      'Send time optimization'
    ],
    metrics: ['Open rate', 'Click-through rate', 'Conversion rate', 'Unsubscribe rate'],
    color: 'secondary'
  },
  {
    id: 'feature-prioritization',
    category: 'Product',
    name: 'Feature Prioritization Research',
    description: 'Understand which features are most valuable to different user segments',
    icon: <TrendingUpIcon />,
    duration: '2-3 hours',
    difficulty: 'Medium',
    requiredPersonas: 6,
    scenarios: [
      'Feature importance ranking',
      'Trade-off analysis',
      'Willingness to pay assessment',
      'Feature combination testing'
    ],
    metrics: ['Feature value score', 'Priority ranking', 'Segment preferences', 'Revenue potential'],
    color: 'warning'
  },
  {
    id: 'mobile-app-testing',
    category: 'Product',
    name: 'Mobile App Experience Testing',
    description: 'Evaluate mobile app features and user experience across different personas',
    icon: <MobileIcon />,
    duration: '2-3 hours',
    difficulty: 'Medium',
    requiredPersonas: 4,
    scenarios: [
      'App store listing optimization',
      'In-app navigation testing',
      'Push notification preferences',
      'Mobile payment flow'
    ],
    metrics: ['App engagement', 'Feature adoption', 'Retention rate', 'In-app conversion'],
    color: 'error'
  },
  {
    id: 'focus-group-discussion',
    category: 'Research',
    name: 'AI Focus Group Discussion',
    description: 'Conduct moderated discussions with AI personas on specific topics',
    icon: <GroupIcon />,
    duration: '1-2 hours',
    difficulty: 'Easy',
    requiredPersonas: 5,
    scenarios: [
      'Product concept validation',
      'Brand perception analysis',
      'Competitive positioning',
      'Market opportunity exploration'
    ],
    metrics: ['Sentiment analysis', 'Theme frequency', 'Consensus level', 'Insight quality'],
    color: 'primary'
  },
  {
    id: 'competitive-analysis',
    category: 'Research',
    name: 'Competitive Response Analysis',
    description: 'Test how personas react to competitor offerings and positioning',
    icon: <PsychologyIcon />,
    duration: '2-3 hours',
    difficulty: 'Hard',
    requiredPersonas: 4,
    scenarios: [
      'Feature comparison reactions',
      'Price comparison responses',
      'Brand switching triggers',
      'Loyalty factor assessment'
    ],
    metrics: ['Switching likelihood', 'Competitive advantages', 'Weakness identification', 'Differentiation gaps'],
    color: 'info'
  }
];

const categories = ['All', 'Pricing', 'Marketing', 'Product', 'Research'];

export default function ExperimentTemplates({ onUseTemplate }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customizeDialog, setCustomizeDialog] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState(new Set());
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const filteredTemplates = selectedCategory === 'All' 
    ? experimentTemplates 
    : experimentTemplates.filter(t => t.category === selectedCategory);

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setCustomDescription(template.description);
    setCustomizeDialog(true);
  };

  const handleConfirmUse = () => {
    if (onUseTemplate) {
      onUseTemplate({
        ...selectedTemplate,
        name: customName,
        description: customDescription,
        customized: true
      });
    }
    setCustomizeDialog(false);
  };

  const toggleSaveTemplate = (templateId) => {
    setSavedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <GlassmorphicCard>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <ScienceIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Experiment Templates Library
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pre-built templates for common marketing experiments
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Chip 
                label={`${savedTemplates.size} Saved`}
                icon={<BookmarkIcon />}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Category Filter */}
          <Box display="flex" gap={1} mb={3} flexWrap="wrap">
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                icon={category === 'All' ? <FilterListIcon /> : undefined}
              />
            ))}
          </Box>

          {/* Templates Grid */}
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Avatar sx={{ bgcolor: `${template.color}.main` }}>
                        {template.icon}
                      </Avatar>
                      <IconButton 
                        size="small"
                        onClick={() => toggleSaveTemplate(template.id)}
                      >
                        {savedTemplates.has(template.id) ? 
                          <BookmarkIcon color="primary" /> : 
                          <BookmarkBorderIcon />
                        }
                      </IconButton>
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {template.description}
                    </Typography>

                    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                      <Chip 
                        label={template.category}
                        size="small"
                        variant="outlined"
                      />
                      <Chip 
                        label={template.duration}
                        size="small"
                        icon={<ScienceIcon />}
                      />
                      <Chip 
                        label={template.difficulty}
                        size="small"
                        color={getDifficultyColor(template.difficulty)}
                      />
                      <Chip 
                        label={`${template.requiredPersonas} personas`}
                        size="small"
                        icon={<GroupIcon />}
                      />
                    </Box>

                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Scenarios:
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        {template.scenarios.slice(0, 2).map((scenario, index) => (
                          <Typography key={index} variant="caption" color="textSecondary">
                            • {scenario}
                          </Typography>
                        ))}
                        {template.scenarios.length > 2 && (
                          <Typography variant="caption" color="primary">
                            +{template.scenarios.length - 2} more scenarios
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => handleUseTemplate(template)}
                        fullWidth
                      >
                        Use Template
                      </Button>
                      <Tooltip title="Duplicate and Edit">
                        <IconButton 
                          size="small"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </GlassmorphicCard>

      {/* Customize Template Dialog */}
      <Dialog open={customizeDialog} onClose={() => setCustomizeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Customize Experiment Template</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <TextField
              fullWidth
              label="Experiment Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              multiline
              rows={3}
              margin="normal"
            />
            
            {selectedTemplate && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Template Details:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Scenarios"
                      secondary={selectedTemplate.scenarios.join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Metrics"
                      secondary={selectedTemplate.metrics.join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Requirements"
                      secondary={`${selectedTemplate.requiredPersonas} personas, ${selectedTemplate.duration}`}
                    />
                  </ListItem>
                </List>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomizeDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmUse} variant="contained" startIcon={<PlayArrowIcon />}>
            Use Template
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
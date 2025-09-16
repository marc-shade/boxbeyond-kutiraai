import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CompareArrows as CompareArrowsIcon,
  Person as PersonIcon,
  SwapHoriz as SwapHorizIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';

// ==============================|| PERSONA COMPARISON ||============================== //

export default function PersonaComparison({ personas = [] }) {
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [comparisonView, setComparisonView] = useState('attributes'); // attributes, behaviors, preferences

  const handlePersonaSelect = (personaId, position) => {
    const newSelection = [...selectedPersonas];
    newSelection[position] = personas.find(p => p.id === personaId);
    setSelectedPersonas(newSelection);
  };

  const handleAddPersona = () => {
    if (selectedPersonas.length < 4) {
      setSelectedPersonas([...selectedPersonas, null]);
    }
  };

  const handleRemovePersona = (index) => {
    const newSelection = selectedPersonas.filter((_, i) => i !== index);
    setSelectedPersonas(newSelection);
  };

  const getAttributeComparison = () => {
    const attributes = [
      'Tech Savviness',
      'Price Sensitivity',
      'Brand Loyalty',
      'Innovation Adoption',
      'Social Influence',
      'Quality Focus'
    ];

    return attributes.map(attr => {
      const data = { attribute: attr };
      selectedPersonas.forEach((persona, index) => {
        if (persona) {
          data[`Persona ${index + 1}`] = Math.floor(Math.random() * 40) + 60;
        }
      });
      return data;
    });
  };

  const getBehaviorComparison = () => {
    const behaviors = [
      'Research Depth',
      'Purchase Frequency',
      'Engagement Rate',
      'Social Sharing',
      'Review Reading',
      'Feature Usage'
    ];

    return behaviors.map(behavior => {
      const data = { behavior };
      selectedPersonas.forEach((persona, index) => {
        if (persona) {
          data[`Persona ${index + 1}`] = Math.floor(Math.random() * 100);
        }
      });
      return data;
    });
  };

  const getPreferenceScores = () => {
    const preferences = [
      { category: 'User Experience', weight: 0.3 },
      { category: 'Pricing', weight: 0.25 },
      { category: 'Features', weight: 0.2 },
      { category: 'Support', weight: 0.15 },
      { category: 'Brand', weight: 0.1 }
    ];

    return preferences.map(pref => ({
      ...pref,
      personas: selectedPersonas.map((persona, index) => ({
        name: persona?.name || `Persona ${index + 1}`,
        score: persona ? Math.floor(Math.random() * 5) + 1 : 0,
        importance: persona ? Math.floor(Math.random() * 100) : 0
      }))
    }));
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  return (
    <Box>
      {/* Header */}
      <GlassmorphicCard sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <CompareArrowsIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Persona Comparison Tool
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Compare up to 4 personas side by side
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Chip
                label="Attributes"
                color={comparisonView === 'attributes' ? 'primary' : 'default'}
                onClick={() => setComparisonView('attributes')}
              />
              <Chip
                label="Behaviors"
                color={comparisonView === 'behaviors' ? 'primary' : 'default'}
                onClick={() => setComparisonView('behaviors')}
              />
              <Chip
                label="Preferences"
                color={comparisonView === 'preferences' ? 'primary' : 'default'}
                onClick={() => setComparisonView('preferences')}
              />
            </Box>
          </Box>

          {/* Persona Selection */}
          <Grid container spacing={2} alignItems="center">
            {selectedPersonas.map((persona, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" color="textSecondary">
                      Persona {index + 1}
                    </Typography>
                    <IconButton size="small" onClick={() => handleRemovePersona(index)}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <FormControl fullWidth size="small">
                    <Select
                      value={persona?.id || ''}
                      onChange={(e) => handlePersonaSelect(e.target.value, index)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select Persona</em>
                      </MenuItem>
                      {personas.map(p => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {persona && (
                    <Box mt={1}>
                      <Typography variant="caption" color="textSecondary">
                        {persona.demographic} • {persona.age_range}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
            {selectedPersonas.length < 4 && (
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    height: 106,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={handleAddPersona}
                >
                  <Box textAlign="center">
                    <IconButton color="primary">
                      <AddIcon />
                    </IconButton>
                    <Typography variant="body2" color="textSecondary">
                      Add Persona
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </GlassmorphicCard>

      {/* Comparison Views */}
      {selectedPersonas.filter(p => p !== null).length >= 2 && (
        <>
          {comparisonView === 'attributes' && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <GlassmorphicCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Attribute Comparison
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={getAttributeComparison()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="attribute" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        {selectedPersonas.map((persona, index) => 
                          persona && (
                            <Radar
                              key={index}
                              name={persona.name}
                              dataKey={`Persona ${index + 1}`}
                              stroke={COLORS[index]}
                              fill={COLORS[index]}
                              fillOpacity={0.3}
                            />
                          )
                        )}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </GlassmorphicCard>
              </Grid>

              <Grid item xs={12} lg={6}>
                <GlassmorphicCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Detailed Comparison
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Attribute</TableCell>
                            {selectedPersonas.map((persona, index) => 
                              persona && (
                                <TableCell key={index} align="center">
                                  {persona.name}
                                </TableCell>
                              )
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {['Tech Savviness', 'Price Sensitivity', 'Brand Loyalty', 'Innovation Adoption'].map(attr => (
                            <TableRow key={attr}>
                              <TableCell>{attr}</TableCell>
                              {selectedPersonas.map((persona, index) => 
                                persona && (
                                  <TableCell key={index} align="center">
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={Math.floor(Math.random() * 40) + 60}
                                        sx={{ width: 60, height: 6, borderRadius: 3 }}
                                      />
                                      <Typography variant="caption">
                                        {Math.floor(Math.random() * 40) + 60}%
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                )
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </GlassmorphicCard>
              </Grid>
            </Grid>
          )}

          {comparisonView === 'behaviors' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <GlassmorphicCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Behavioral Patterns
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={getBehaviorComparison()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="behavior" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        {selectedPersonas.map((persona, index) => 
                          persona && (
                            <Bar
                              key={index}
                              dataKey={`Persona ${index + 1}`}
                              fill={COLORS[index]}
                              name={persona.name}
                            />
                          )
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </GlassmorphicCard>
              </Grid>

              <Grid item xs={12}>
                <GlassmorphicCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Engagement Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedPersonas.map((persona, index) => 
                        persona && (
                          <Grid item xs={12} sm={6} md={3} key={index}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <Avatar sx={{ bgcolor: COLORS[index], width: 32, height: 32 }}>
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                                <Typography variant="subtitle2">
                                  {persona.name}
                                </Typography>
                              </Box>
                              <Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2">Response Rate</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {Math.floor(Math.random() * 30) + 70}%
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2">Avg Session</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {Math.floor(Math.random() * 10) + 5}m
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2">Conversion</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {Math.floor(Math.random() * 20) + 10}%
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                        )
                      )}
                    </Grid>
                  </CardContent>
                </GlassmorphicCard>
              </Grid>
            </Grid>
          )}

          {comparisonView === 'preferences' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <GlassmorphicCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Preference Analysis
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell>Weight</TableCell>
                            {selectedPersonas.map((persona, index) => 
                              persona && (
                                <TableCell key={index} align="center">
                                  {persona.name}
                                </TableCell>
                              )
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getPreferenceScores().map((pref, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {pref.category}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${(pref.weight * 100).toFixed(0)}%`}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              {pref.personas.map((personaPref, pIndex) => 
                                selectedPersonas[pIndex] && (
                                  <TableCell key={pIndex} align="center">
                                    <Box>
                                      <Rating 
                                        value={personaPref.score} 
                                        readOnly 
                                        size="small"
                                      />
                                      <Typography variant="caption" display="block" color="textSecondary">
                                        Importance: {personaPref.importance}%
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                )
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </GlassmorphicCard>
              </Grid>

              <Grid item xs={12}>
                <GlassmorphicCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Key Differences
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedPersonas.filter(p => p).map((persona, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <Avatar sx={{ bgcolor: COLORS[index], width: 32, height: 32 }}>
                                <PersonIcon fontSize="small" />
                              </Avatar>
                              <Typography variant="subtitle2">
                                {persona.name}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="success.main" gutterBottom>
                                <strong>Strengths:</strong>
                              </Typography>
                              <Typography variant="body2" paragraph>
                                • High engagement with AI features<br/>
                                • Strong brand loyalty potential<br/>
                                • Active in community forums
                              </Typography>
                              <Typography variant="body2" color="error.main" gutterBottom>
                                <strong>Challenges:</strong>
                              </Typography>
                              <Typography variant="body2">
                                • Price sensitive above $99<br/>
                                • Requires extensive onboarding<br/>
                                • Low initial trust in automation
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </GlassmorphicCard>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {selectedPersonas.filter(p => p !== null).length < 2 && (
        <GlassmorphicCard>
          <CardContent>
            <Box textAlign="center" py={4}>
              <CompareArrowsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                Select at least 2 personas to compare
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Use the dropdowns above to choose personas for comparison
              </Typography>
            </Box>
          </CardContent>
        </GlassmorphicCard>
      )}
    </Box>
  );
}
import { useState, useEffect } from 'react';

// material-ui
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Close as CloseIcon,
  Science as ScienceIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// project import
import { personaLabAPI } from 'api/persona-lab';

// ==============================|| EXPERIMENT MODAL ||============================== //

export default function ExperimentModal({ open, onClose, experiment = null, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hypothesis: '',
    experiment_type: 'marketing_message',
    target_personas: [],
    test_scenarios: [],
    success_metrics: [],
    duration_hours: 24,
    parallel_execution: true,
    voice_enabled: false
  });

  const [availablePersonas, setAvailablePersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    stimulus: '',
    questions: ['']
  });
  const [newMetric, setNewMetric] = useState('');

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const result = await personaLabAPI.getPersonas();
        if (result.success) {
          setAvailablePersonas(result.personas);
        }
      } catch (error) {
        console.error('Error fetching personas:', error);
      }
    };

    if (open) {
      fetchPersonas();
    }

    if (experiment) {
      setFormData({
        name: experiment.name || '',
        description: experiment.description || '',
        hypothesis: experiment.hypothesis || '',
        experiment_type: experiment.experiment_type || 'marketing_message',
        target_personas: experiment.target_personas || [],
        test_scenarios: experiment.test_scenarios || [],
        success_metrics: experiment.success_metrics || [],
        duration_hours: experiment.duration_hours || 24,
        parallel_execution: experiment.parallel_execution !== false,
        voice_enabled: experiment.voice_enabled || false
      });
    } else {
      // Reset form for new experiment
      setFormData({
        name: '',
        description: '',
        hypothesis: '',
        experiment_type: 'marketing_message',
        target_personas: [],
        test_scenarios: [],
        success_metrics: [],
        duration_hours: 24,
        parallel_execution: true,
        voice_enabled: false
      });
    }
  }, [experiment, open]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handlePersonaSelection = (event) => {
    setFormData(prev => ({
      ...prev,
      target_personas: event.target.value
    }));
  };

  const handleAddScenario = () => {
    if (newScenario.name && newScenario.stimulus) {
      setFormData(prev => ({
        ...prev,
        test_scenarios: [...prev.test_scenarios, {
          ...newScenario,
          id: `scenario_${Date.now()}`,
          questions: newScenario.questions.filter(q => q.trim())
        }]
      }));
      setNewScenario({
        name: '',
        description: '',
        stimulus: '',
        questions: ['']
      });
    }
  };

  const handleRemoveScenario = (index) => {
    setFormData(prev => ({
      ...prev,
      test_scenarios: prev.test_scenarios.filter((_, i) => i !== index)
    }));
  };

  const handleAddMetric = () => {
    if (newMetric.trim() && !formData.success_metrics.includes(newMetric.trim())) {
      setFormData(prev => ({
        ...prev,
        success_metrics: [...prev.success_metrics, newMetric.trim()]
      }));
      setNewMetric('');
    }
  };

  const handleRemoveMetric = (index) => {
    setFormData(prev => ({
      ...prev,
      success_metrics: prev.success_metrics.filter((_, i) => i !== index)
    }));
  };

  const handleScenarioQuestionChange = (index, value) => {
    const updatedQuestions = [...newScenario.questions];
    updatedQuestions[index] = value;
    
    // Add new empty question if the last one is filled
    if (index === updatedQuestions.length - 1 && value.trim()) {
      updatedQuestions.push('');
    }
    
    setNewScenario(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const experimentData = {
        ...formData,
        persona_count: formData.target_personas.length,
        scenario_count: formData.test_scenarios.length,
        status: 'draft'
      };

      let result;
      if (experiment) {
        // Update existing experiment
        result = await personaLabAPI.updateExperiment(experiment.id, experimentData);
      } else {
        // Create new experiment
        result = await personaLabAPI.createExperiment(experimentData);
      }

      if (result.success) {
        onSave(result.experiment);
        onClose();
      }
    } catch (error) {
      console.error('Error saving experiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const experimentTypes = [
    { value: 'marketing_message', label: 'Marketing Message Testing' },
    { value: 'product_feedback', label: 'Product Feedback Collection' },
    { value: 'pricing_strategy', label: 'Pricing Strategy Analysis' },
    { value: 'user_journey', label: 'User Journey Optimization' },
    { value: 'brand_perception', label: 'Brand Perception Study' },
    { value: 'feature_validation', label: 'Feature Validation' }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '85vh',
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
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <ScienceIcon />
          </Avatar>
          <Typography variant="h5">
            {experiment ? 'Edit Experiment' : 'Create New Experiment'}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Experiment Name *"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
              placeholder="e.g., SaaS Product Launch Test"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Experiment Type</InputLabel>
              <Select
                value={formData.experiment_type}
                onChange={handleInputChange('experiment_type')}
                label="Experiment Type"
              >
                {experimentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="Brief description of the experiment..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Hypothesis *"
              multiline
              rows={2}
              value={formData.hypothesis}
              onChange={handleInputChange('hypothesis')}
              required
              placeholder="What do you expect to learn from this experiment?"
            />
          </Grid>

          {/* Persona Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Target Personas
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Personas</InputLabel>
              <Select
                multiple
                value={formData.target_personas}
                onChange={handlePersonaSelection}
                label="Select Personas"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const persona = availablePersonas.find(p => p.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={persona ? persona.name : value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {availablePersonas.map((persona) => (
                  <MenuItem key={persona.id} value={persona.id}>
                    {persona.name} - {persona.occupation}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Test Scenarios */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Test Scenarios
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Add New Scenario
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Scenario Name"
                      value={newScenario.name}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Landing Page A"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={newScenario.description}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Stimulus/Content *"
                      multiline
                      rows={3}
                      value={newScenario.stimulus}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, stimulus: e.target.value }))}
                      placeholder="The content/stimulus to present to personas (e.g., marketing copy, product description, etc.)"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Follow-up Questions
                    </Typography>
                    {newScenario.questions.map((question, index) => (
                      <TextField
                        key={index}
                        fullWidth
                        label={`Question ${index + 1}`}
                        value={question}
                        onChange={(e) => handleScenarioQuestionChange(index, e.target.value)}
                        placeholder="What question would you ask the persona?"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={handleAddScenario}
                      disabled={!newScenario.name || !newScenario.stimulus}
                      startIcon={<AddIcon />}
                    >
                      Add Scenario
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Existing Scenarios */}
          {formData.test_scenarios.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Configured Scenarios ({formData.test_scenarios.length})
              </Typography>
              <List>
                {formData.test_scenarios.map((scenario, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={scenario.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {scenario.description}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Stimulus:</strong> {scenario.stimulus.substring(0, 100)}...
                          </Typography>
                          <Typography variant="body2">
                            <strong>Questions:</strong> {scenario.questions.length} questions
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleRemoveScenario(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}

          {/* Success Metrics */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Success Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {formData.success_metrics.map((metric, index) => (
                <Chip
                  key={index}
                  label={metric}
                  onDelete={() => handleRemoveMetric(index)}
                  variant="outlined"
                />
              ))}
            </Box>
            <Box display="flex" gap={1}>
              <TextField
                value={newMetric}
                onChange={(e) => setNewMetric(e.target.value)}
                placeholder="Add success metric (e.g., engagement rate, conversion intent)"
                sx={{ flexGrow: 1 }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMetric()}
              />
              <Button
                variant="outlined"
                onClick={handleAddMetric}
                disabled={!newMetric.trim()}
              >
                Add
              </Button>
            </Box>
          </Grid>

          {/* Configuration */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Configuration
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Duration (hours)"
              type="number"
              value={formData.duration_hours}
              onChange={handleInputChange('duration_hours')}
              inputProps={{ min: 1, max: 168 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.parallel_execution}
                  onChange={(e) => setFormData(prev => ({ ...prev, parallel_execution: e.target.checked }))}
                />
              }
              label="Parallel Execution"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.voice_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, voice_enabled: e.target.checked }))}
                />
              }
              label="Voice Responses"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.name || !formData.hypothesis || formData.target_personas.length === 0}
        >
          {loading ? 'Saving...' : experiment ? 'Update Experiment' : 'Create Experiment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
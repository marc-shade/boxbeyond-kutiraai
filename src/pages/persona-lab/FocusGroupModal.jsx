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
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Slider
} from '@mui/material';
import { 
  Close as CloseIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// project import
import { personaLabAPI } from 'api/persona-lab';

// ==============================|| FOCUS GROUP MODAL ||============================== //

export default function FocusGroupModal({ open, onClose, focusGroup = null, onSave }) {
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    discussion_type: 'open_discussion',
    participant_personas: [],
    discussion_rounds: 3,
    session_duration: 60,
    moderation_style: 'guided',
    questions: [],
    voice_enabled: false
  });

  const [availablePersonas, setAvailablePersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

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

    if (focusGroup) {
      setFormData({
        topic: focusGroup.topic || '',
        description: focusGroup.description || '',
        discussion_type: focusGroup.discussion_type || 'open_discussion',
        participant_personas: focusGroup.participant_personas || [],
        discussion_rounds: focusGroup.discussion_rounds || 3,
        session_duration: focusGroup.session_duration || 60,
        moderation_style: focusGroup.moderation_style || 'guided',
        questions: focusGroup.questions || [],
        voice_enabled: focusGroup.voice_enabled || false
      });
    } else {
      // Reset form for new focus group
      setFormData({
        topic: '',
        description: '',
        discussion_type: 'open_discussion',
        participant_personas: [],
        discussion_rounds: 3,
        session_duration: 60,
        moderation_style: 'guided',
        questions: [],
        voice_enabled: false
      });
    }
  }, [focusGroup, open]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handlePersonaSelection = (event) => {
    setFormData(prev => ({
      ...prev,
      participant_personas: event.target.value
    }));
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion.trim()]
      }));
      setNewQuestion('');
    }
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleRoundsChange = (event, value) => {
    setFormData(prev => ({
      ...prev,
      discussion_rounds: value
    }));
  };

  const handleDurationChange = (event, value) => {
    setFormData(prev => ({
      ...prev,
      session_duration: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const focusGroupData = {
        ...formData,
        participant_count: formData.participant_personas.length,
        status: 'draft'
      };

      let result;
      if (focusGroup) {
        // Update existing focus group - need to add this method to API
        result = await personaLabAPI.updateFocusGroup(focusGroup.id, focusGroupData);
      } else {
        // Create new focus group
        result = await personaLabAPI.createFocusGroup(focusGroupData);
      }

      if (result.success) {
        onSave(result.focus_group);
        onClose();
      }
    } catch (error) {
      console.error('Error saving focus group:', error);
    } finally {
      setLoading(false);
    }
  };

  const discussionTypes = [
    { value: 'open_discussion', label: 'Open Discussion' },
    { value: 'structured_debate', label: 'Structured Debate' },
    { value: 'brainstorming', label: 'Brainstorming Session' },
    { value: 'feedback_session', label: 'Product Feedback' },
    { value: 'concept_testing', label: 'Concept Testing' },
    { value: 'user_journey_mapping', label: 'User Journey Mapping' }
  ];

  const moderationStyles = [
    { value: 'guided', label: 'Guided - AI moderates discussion' },
    { value: 'free_form', label: 'Free Form - Minimal moderation' },
    { value: 'structured', label: 'Structured - Question-based rounds' },
    { value: 'facilitator', label: 'Facilitator - Strong moderator presence' }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
          <Avatar sx={{ bgcolor: 'warning.main' }}>
            <GroupIcon />
          </Avatar>
          <Typography variant="h5">
            {focusGroup ? 'Edit Focus Group' : 'Create New Focus Group'}
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
              label="Discussion Topic *"
              value={formData.topic}
              onChange={handleInputChange('topic')}
              required
              placeholder="e.g., Mobile App User Experience"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Discussion Type</InputLabel>
              <Select
                value={formData.discussion_type}
                onChange={handleInputChange('discussion_type')}
                label="Discussion Type"
              >
                {discussionTypes.map((type) => (
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
              placeholder="Brief description of the focus group objectives..."
            />
          </Grid>

          {/* Participants */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Participants
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Personas</InputLabel>
              <Select
                multiple
                value={formData.participant_personas}
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
                          color="primary"
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

          {/* Session Configuration */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Session Configuration
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Discussion Rounds: {formData.discussion_rounds}
            </Typography>
            <Slider
              value={formData.discussion_rounds}
              onChange={handleRoundsChange}
              step={1}
              marks
              min={1}
              max={5}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Session Duration: {formData.session_duration} minutes
            </Typography>
            <Slider
              value={formData.session_duration}
              onChange={handleDurationChange}
              step={15}
              marks
              min={30}
              max={180}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Moderation Style</InputLabel>
              <Select
                value={formData.moderation_style}
                onChange={handleInputChange('moderation_style')}
                label="Moderation Style"
              >
                {moderationStyles.map((style) => (
                  <MenuItem key={style.value} value={style.value}>
                    {style.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Discussion Questions */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Discussion Questions
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Add Discussion Question
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    label="Question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="What are your thoughts on..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddQuestion}
                    disabled={!newQuestion.trim()}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Box>

                {formData.questions.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Configured Questions ({formData.questions.length})
                    </Typography>
                    <List dense>
                      {formData.questions.map((question, index) => (
                        <ListItem key={index} divider>
                          <ListItemText
                            primary={`Q${index + 1}: ${question}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton onClick={() => handleRemoveQuestion(index)} size="small">
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
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
          disabled={loading || !formData.topic || formData.participant_personas.length === 0}
        >
          {loading ? 'Saving...' : focusGroup ? 'Update Focus Group' : 'Create Focus Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
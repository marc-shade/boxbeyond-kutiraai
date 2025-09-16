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
  Divider
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Add as AddIcon,
  PersonAdd as PersonAddIcon 
} from '@mui/icons-material';

// project import
import { personaLabAPI } from 'api/persona-lab';

// ==============================|| PERSONA MODAL ||============================== //

export default function PersonaModal({ open, onClose, persona = null, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    occupation: '',
    age: '',
    location: '',
    personality_traits: [],
    interests: [],
    pain_points: [],
    goals: [],
    background: '',
    decision_making_style: 'analytical',
    communication_preference: 'direct',
    technology_comfort: 'medium'
  });

  const [loading, setLoading] = useState(false);
  const [newTrait, setNewTrait] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (persona) {
      setFormData({
        name: persona.name || '',
        occupation: persona.occupation || '',
        age: persona.age?.toString() || '',
        location: persona.location || '',
        personality_traits: persona.personality_traits || [],
        interests: persona.interests || [],
        pain_points: persona.pain_points || [],
        goals: persona.goals || [],
        background: persona.background || '',
        decision_making_style: persona.decision_making_style || 'analytical',
        communication_preference: persona.communication_preference || 'direct',
        technology_comfort: persona.technology_comfort || 'medium'
      });
    } else {
      // Reset form for new persona
      setFormData({
        name: '',
        occupation: '',
        age: '',
        location: '',
        personality_traits: [],
        interests: [],
        pain_points: [],
        goals: [],
        background: '',
        decision_making_style: 'analytical',
        communication_preference: 'direct',
        technology_comfort: 'medium'
      });
    }
  }, [persona, open]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddItem = (field, value, setter) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter('');
    }
  };

  const handleRemoveItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const personaData = {
        ...formData,
        age: parseInt(formData.age) || 0,
        status: 'active'
      };

      let result;
      if (persona) {
        // Update existing persona
        result = await personaLabAPI.updatePersona(persona.id, personaData);
      } else {
        // Create new persona
        result = await personaLabAPI.createPersona(personaData);
      }

      if (result.success) {
        onSave(result.persona);
        onClose();
      }
    } catch (error) {
      console.error('Error saving persona:', error);
    } finally {
      setLoading(false);
    }
  };

  const ChipField = ({ items, onAdd, onRemove, newValue, setNewValue, label, placeholder }) => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item}
            onDelete={() => onRemove(index)}
            variant="outlined"
            size="small"
          />
        ))}
      </Box>
      <Box display="flex" gap={1}>
        <TextField
          size="small"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={placeholder}
          onKeyPress={(e) => e.key === 'Enter' && onAdd()}
          sx={{ flexGrow: 1 }}
        />
        <IconButton 
          onClick={onAdd}
          disabled={!newValue.trim()}
          size="small"
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '80vh',
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
            <PersonAddIcon />
          </Avatar>
          <Typography variant="h5">
            {persona ? 'Edit Persona' : 'Create New Persona'}
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

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name *"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Occupation *"
              value={formData.occupation}
              onChange={handleInputChange('occupation')}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={formData.age}
              onChange={handleInputChange('age')}
              inputProps={{ min: 18, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={handleInputChange('location')}
              placeholder="e.g., San Francisco, CA"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Background"
              multiline
              rows={3}
              value={formData.background}
              onChange={handleInputChange('background')}
              placeholder="Brief background about this persona..."
            />
          </Grid>

          {/* Personality & Characteristics */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Personality & Characteristics
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <ChipField
              items={formData.personality_traits}
              onAdd={() => handleAddItem('personality_traits', newTrait, setNewTrait)}
              onRemove={(index) => handleRemoveItem('personality_traits', index)}
              newValue={newTrait}
              setNewValue={setNewTrait}
              label="Personality Traits"
              placeholder="Add trait (e.g., creative, analytical)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ChipField
              items={formData.interests}
              onAdd={() => handleAddItem('interests', newInterest, setNewInterest)}
              onRemove={(index) => handleRemoveItem('interests', index)}
              newValue={newInterest}
              setNewValue={setNewInterest}
              label="Interests"
              placeholder="Add interest"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ChipField
              items={formData.pain_points}
              onAdd={() => handleAddItem('pain_points', newPainPoint, setNewPainPoint)}
              onRemove={(index) => handleRemoveItem('pain_points', index)}
              newValue={newPainPoint}
              setNewValue={setNewPainPoint}
              label="Pain Points"
              placeholder="Add pain point"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ChipField
              items={formData.goals}
              onAdd={() => handleAddItem('goals', newGoal, setNewGoal)}
              onRemove={(index) => handleRemoveItem('goals', index)}
              newValue={newGoal}
              setNewValue={setNewGoal}
              label="Goals"
              placeholder="Add goal"
            />
          </Grid>

          {/* Behavioral Preferences */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Behavioral Preferences
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Decision Making Style</InputLabel>
              <Select
                value={formData.decision_making_style}
                onChange={handleInputChange('decision_making_style')}
                label="Decision Making Style"
              >
                <MenuItem value="analytical">Analytical</MenuItem>
                <MenuItem value="intuitive">Intuitive</MenuItem>
                <MenuItem value="collaborative">Collaborative</MenuItem>
                <MenuItem value="quick">Quick/Impulsive</MenuItem>
                <MenuItem value="careful">Careful/Deliberate</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Communication Style</InputLabel>
              <Select
                value={formData.communication_preference}
                onChange={handleInputChange('communication_preference')}
                label="Communication Style"
              >
                <MenuItem value="direct">Direct</MenuItem>
                <MenuItem value="diplomatic">Diplomatic</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="formal">Formal</MenuItem>
                <MenuItem value="enthusiastic">Enthusiastic</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Technology Comfort</InputLabel>
              <Select
                value={formData.technology_comfort}
                onChange={handleInputChange('technology_comfort')}
                label="Technology Comfort"
              >
                <MenuItem value="low">Low - Prefers simple solutions</MenuItem>
                <MenuItem value="medium">Medium - Comfortable with common tools</MenuItem>
                <MenuItem value="high">High - Early adopter</MenuItem>
              </Select>
            </FormControl>
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
          disabled={loading || !formData.name || !formData.occupation}
        >
          {loading ? 'Saving...' : persona ? 'Update Persona' : 'Create Persona'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
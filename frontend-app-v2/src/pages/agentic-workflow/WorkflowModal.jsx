import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  IconButton,
  FormControl,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const WorkflowModal = ({ open, handleClose, handleSubmit, initialData }) => {

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: {
      author: '',
      tags: [],
      version: "0.0.1",
      inputs: [{
        name: '',
        description: '',
        type: 'string',
        required: false
      }],
      settings: {
        process: 'sequential'
      },
      agents: {}, // Added agents array
      tasks: []
    }
  });

  // When handling initialData in useEffect
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        id: initialData.id || null,
        config: {
          author: initialData.config?.author || '',
          version: "0.0.1",
          tags: initialData.config?.tags || [],
          inputs: initialData.config?.inputs || [{
            name: '',
            description: '',
            type: 'string',
            required: false
          }],
          settings: {
            process: initialData.config?.settings?.process || 'sequential'
          }
        },
        agents: initialData.agents && typeof initialData.agents === 'object' 
        ? Object.entries(initialData.agents).reduce((acc, [key, agent]) => ({
            ...acc,
            [key]: {
              id: agent.id || key,
              name: agent.name || '',
              role: agent.role || '',
              goal: agent.goal || '',
              backstory: agent.backstory || '',
              verbose: agent.verbose || true,
              allow_delegation: agent.allow_delegation || false,
              temperature: agent.temperature || 0.5,
              max_iter: agent.max_iter || 1
            }
          }), {})
        : {},
        tasks: Array.isArray(initialData.tasks) ? initialData.tasks.map(task => ({
          name: task.name || '',
          description: task.description || '',
          agent: task.agent || null,
          expected_output: task.expected_output || ''
        })) : []
      });
    }
  }, [initialData]);

  const handleChange = (path, value) => {
    setFormData(prevData => {
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        return {
          ...prevData,
          [parent]: {
            ...prevData[parent],
            [child]: value
          }
        };
      }
      return {
        ...prevData,
        [path]: value
      };
    });
  };

  const handleTagChange = (event) => {
    const tags = event.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
      
    handleChange('config.tags', tags);
  };
  

  const handleInputParameterChange = (index, field, value) => {
    const newInputs = [...formData.config.inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    handleChange('config', {
      ...formData.config,
      inputs: newInputs
    });
  };

  const addInputParameter = () => {
    setFormData(prevData => ({
      ...prevData,
      config: {
        ...prevData.config,
        inputs: [
          ...(prevData.config.inputs || []),
          { name: '', description: '', type: 'string', required: false }
        ]
      }
    }));
  };

  const removeInputParameter = (index) => {
    const newInputs = formData.config.inputs.filter((_, i) => i !== index);
    handleChange('config', {
      ...formData.config,
      inputs: newInputs
    });
  };

  const handleSave = () => {
    handleSubmit(formData);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
      }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {initialData ? 'Edit Workflow' : 'Create New Workflow'}
        </Typography>

        <TextField
          fullWidth
          margin="normal"
          label="Workflow Name"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          inputlabelprops={{ shrink: true }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Description"
          multiline
          rows={3}
          value={formData.description || ''}
          inputlabelprops={{ shrink: true }}
          onChange={(e) => handleChange('description', e.target.value)}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Author"
          value={formData.config.author || ''}
          inputlabelprops={{ shrink: true }}
          onChange={(e) => handleChange('config.author', e.target.value)}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Tags (comma-separated)"
          value={formData.config.tags?.join(', ') || ''}
          inputlabelprops={{ shrink: true }}
          onChange={handleTagChange}
        />

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Input Parameters
        </Typography>
        {formData.config.inputs?.map((param, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
            <TextField
              fullWidth
              margin="dense"
              label="Name"
              value={param.name || ''}
              inputlabelprops={{ shrink: true }}
              onChange={(e) => handleInputParameterChange(index, 'name', e.target.value)}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Description"
              value={param.description || ''}
              inputlabelprops={{ shrink: true }}
              onChange={(e) => handleInputParameterChange(index, 'description', e.target.value)}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id={`type-select-label-${index}`}>Type</InputLabel>
              <Select
                labelId={`type-select-label-${index}`}
                label="Type"
                value={param.type || 'string'}
                inputlabelprops={{ shrink: true }}
                onChange={(e) => handleInputParameterChange(index, 'type', e.target.value)}
              >
                <MenuItem value="string">String</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
                <MenuItem value="int">Integer</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={param.required}
                  onChange={(e) => handleInputParameterChange(index, 'required', e.target.checked)}
                />
              }
              label="Required"
            />
            <IconButton onClick={() => removeInputParameter(index)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button startIcon={<AddIcon />} onClick={addInputParameter}>
          Add Input Parameter
        </Button>

        <FormControl fullWidth margin="dense">
          <InputLabel id="process-select-label">Process</InputLabel>
          <Select
            labelId="process-select-label"
            label="Process"
            value={formData.config.settings.process || 'sequential'}
            onChange={(e) => handleChange('process', e.target.value)}
          >
            <MenuItem value="sequential">Sequential</MenuItem>
            <MenuItem value="parallel">Parallel</MenuItem>
          </Select>
        </FormControl>

        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Workflow
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClose} sx={{ ml: 2 }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default WorkflowModal;

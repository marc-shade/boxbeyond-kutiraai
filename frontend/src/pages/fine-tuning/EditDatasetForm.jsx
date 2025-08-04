import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { GlassmorphicDialog } from 'themes/GlassmorphicComponents';

const FieldDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(1.5),
}));

// Predefined model templates
const MODEL_TEMPLATES = {
  'llama3.2': {
    name: 'LLaMA 3.2 Template',
    template: '<|begin_of_text|><|start_header_id|>system<|end_header_id|>{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>{question}<|eot_id|><|start_header_id|>assistant<|end_header_id|>{answer}<|eot_id|>'
  },
  'mistral': {
    name: 'Mistral AI Template',
    template: '<s>[INST] Question: {question} [/INST] {answer}</s>'
  },
  'custom': {
    name: 'Custom Template',
    template: ''
  }
};

const EditDatasetForm = ({ open, onClose, onSubmit, dataset, loading = false }) => {
  const [formData, setFormData] = useState({
    dataset_name: '',
    dataset_desc: '',
    dataset_domain: '',
    dataset_origin: 'local',
    dataset_filepath: '',
    dataset_workflow_url: '',
    dataset_model_template: '',
    dataset_system_prompt: '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [isCustomTemplate, setIsCustomTemplate] = useState(true);
  const [error, setError] = useState('');

  // Populate form when dataset prop changes
  useEffect(() => {
    if (dataset) {
      setFormData({
        dataset_name: dataset.dataset_name || '',
        dataset_desc: dataset.dataset_desc || '',
        dataset_domain: dataset.dataset_domain || '',
        dataset_origin: dataset.dataset_origin || 'local',
        dataset_filepath: dataset.dataset_filepath || '',
        dataset_workflow_url: dataset.dataset_workflow_url || '',
        dataset_model_template: dataset.dataset_model_template || '',
        dataset_system_prompt: dataset.dataset_system_prompt || '',
      });

      // Determine which template is selected
      const templateKey = Object.keys(MODEL_TEMPLATES).find(
        key => MODEL_TEMPLATES[key].template === dataset.dataset_model_template
      );
      if (templateKey) {
        setSelectedTemplate(templateKey);
        setIsCustomTemplate(templateKey === 'custom');
      } else {
        setSelectedTemplate('custom');
        setIsCustomTemplate(true);
      }
    }
  }, [dataset]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user makes changes
  };

  const handleRadioChange = (event) => {
    setFormData({
      ...formData,
      dataset_origin: event.target.value
    });
  };

  const handleTemplateChange = (event) => {
    const templateKey = event.target.value;
    setSelectedTemplate(templateKey);

    if (templateKey === 'custom') {
      setIsCustomTemplate(true);
      // Keep current custom template value
    } else {
      setIsCustomTemplate(false);
      setFormData({
        ...formData,
        dataset_model_template: MODEL_TEMPLATES[templateKey].template
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      // Basic validation
      if (!formData.dataset_name.trim()) {
        setError('Dataset name is required');
        return;
      }
      
      if (!formData.dataset_desc.trim()) {
        setError('Dataset description is required');
        return;
      }

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update dataset');
    }
  };

  const canEdit = dataset?.dataset_status === 'Pending';

  return (
    <GlassmorphicDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          {canEdit ? 'Edit Dataset' : 'View Dataset Details'}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {!canEdit && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This dataset can only be edited when its status is "Pending". 
            Currently: {dataset?.dataset_status}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          name="dataset_name"
          label="Name"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.dataset_name}
          onChange={handleChange}
          disabled={!canEdit || loading}
          required
        />
        <FieldDescription>Enter a unique name for your dataset.</FieldDescription>

        <TextField
          margin="dense"
          name="dataset_desc"
          label="Description"
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={formData.dataset_desc}
          onChange={handleChange}
          disabled={!canEdit || loading}
          required
        />
        <FieldDescription>Provide a brief description of the dataset's content and purpose.</FieldDescription>

        <TextField
          margin="dense"
          name="dataset_domain"
          label="Domain"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.dataset_domain}
          onChange={handleChange}
          disabled={!canEdit || loading}
          required
        />
        <FieldDescription>Specify the domain or category of your dataset (e.g., healthcare, finance, legal).</FieldDescription>

        <Box mb={2}>
          <FormLabel component="legend">
            <Typography fontWeight="bold">Dataset Origin</Typography>
          </FormLabel>
          <RadioGroup 
            row 
            name="dataset_origin" 
            value={formData.dataset_origin} 
            onChange={handleRadioChange}
          >
            <FormControlLabel 
              value="local" 
              control={<Radio disabled={!canEdit || loading} />} 
              label="Local Drive" 
            />
            <FormControlLabel 
              value="google" 
              control={<Radio disabled={!canEdit || loading} />} 
              label="Google Drive" 
            />
          </RadioGroup>
        </Box>
        <FieldDescription>Choose the source location of your dataset files.</FieldDescription>

        {formData.dataset_origin === 'local' && (
          <>
            <TextField
              margin="dense"
              name="dataset_filepath"
              label="Dataset Local Filepath"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.dataset_filepath}
              onChange={handleChange}
              disabled={!canEdit || loading}
              required
            />
            <FieldDescription>
              Enter only the folder name which contains the documents. 
              Folder should reside in $HOME/workspace/file_share directory.
            </FieldDescription>
          </>
        )}

        <TextField
          margin="dense"
          name="dataset_workflow_url"
          label="Process Workflow URL"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.dataset_workflow_url}
          onChange={handleChange}
          disabled={!canEdit || loading}
          required
        />
        <FieldDescription>Enter the n8n workflow webhook URL for processing this dataset.</FieldDescription>

        <Box mb={2}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Model Template</InputLabel>
            <Select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              disabled={!canEdit || loading}
              label="Model Template"
            >
              {Object.entries(MODEL_TEMPLATES).map(([key, template]) => (
                <MenuItem key={key} value={key}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FieldDescription>Choose a predefined template or create a custom one.</FieldDescription>
        </Box>

        {isCustomTemplate && (
          <>
            <TextField
              margin="dense"
              name="dataset_model_template"
              label="Custom Model Template"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={formData.dataset_model_template}
              onChange={handleChange}
              disabled={!canEdit || loading}
              placeholder="Enter your custom template with placeholders like {system_prompt}, {question}, {answer}"
            />
            <FieldDescription>
              Define your custom template using placeholders: {'{system_prompt}'}, {'{question}'}, {'{answer}'}
            </FieldDescription>
          </>
        )}

        <TextField
          margin="dense"
          name="dataset_system_prompt"
          label="System Prompt Template"
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={formData.dataset_system_prompt}
          onChange={handleChange}
          disabled={!canEdit || loading}
        />
        <FieldDescription>Specify the system prompt template used for this dataset (optional).</FieldDescription>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {canEdit ? 'Cancel' : 'Close'}
        </Button>
        {canEdit && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Dataset'}
          </Button>
        )}
      </DialogActions>
    </GlassmorphicDialog>
  );
};

export default EditDatasetForm;

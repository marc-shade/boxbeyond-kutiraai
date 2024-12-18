// FineTuneSettings.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  Grid,
  Tooltip,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  InputAdornment,
  TextField,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse,
  Button,
  Stack
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TuneIcon from '@mui/icons-material/Tune';
import SpeedIcon from '@mui/icons-material/Speed';
import LayersIcon from '@mui/icons-material/Layers';
import MemoryIcon from '@mui/icons-material/Memory';
import SaveIcon from '@mui/icons-material/Save';
import FolderIcon from '@mui/icons-material/Folder';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import { validateModelName, validateDirectory } from 'utils/validation';

function FineTuneSettings({ formData, onUpdate }) {
  const [settings, setSettings] = useState(() => ({
    num_iterations: formData?.num_iterations || 1000,
    steps_per_eval: formData?.steps_per_eval || 100,
    num_layers: formData?.num_layers || 16,
    learning_rate: formData?.learning_rate || '1e-5',
    batch_size: formData?.batch_size || 25,
    finetuned_model_name: formData?.finetuned_model_name || '',
    processed_file_full_path: formData?.processed_file_full_path || '',
    advancedMode: formData?.advancedMode || false,
    train_split: formData?.train_split || 70,
    validation_split: formData?.validation_split || 20,
    test_split: formData?.test_split || 10
  }));

  // Update your state to include validation messages
  const [validationMessages, setValidationMessages] = useState({
    finetuned_model_name: "",
    processed_file_full_path: ""
  });

  // Update parent component whenever settings change
  useEffect(() => {
    onUpdate(settings);
  }, [settings, onUpdate]);

  const handleSettingChange = (field, value) => {
    const newSettings = {
      ...settings,
      [field]: value
    };
    setSettings(newSettings);

    if (field === 'finetuned_model_name' || field === 'processed_file_full_path') {
      setValidationMessages(prev => ({
        ...prev,
        [field]: getValidationMessage(field, value)
      }));
    }
  };

  const learningRateOptions = [
    { value: '1e-6', label: '1e-6 (Very Fine)' },
    { value: '1e-5', label: '1e-5 (Recommended)' },
    { value: '1e-4', label: '1e-4 (Aggressive)' },
    { value: '1e-3', label: '1e-3 (Very Aggressive)' }
  ];

  const batchSizeOptions = [
    { value: 8, label: '8 (Conservative)' },
    { value: 16, label: '16 (Balanced)' },
    { value: 25, label: '25 (Recommended)' },
    { value: 32, label: '32 (Performance)' },
    { value: -1, label: 'Full Dataset' }
  ];

  // In your component...
  const getValidationMessage = (field, value) => {
    if (field === 'finetuned_model_name') {
      if (!value.trim()) return "Model name is required";
      // Only allow letters, numbers, and underscores
      const modelNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!modelNameRegex.test(value)) {
        return "Model name must start with a letter and can only contain letters, numbers, and underscores";
      }
      if (value.length < 3 || value.length > 30) {
        return "Model name must be between 3 and 30 characters";
      }
      return "";
    }

    if (field === 'processed_file_full_path') {
      if (!value.trim()) return "Processing directory is required";
      if (!validateDirectory(value)) {
        if (!value.startsWith('/')) {
          return "Directory must be an absolute path starting with /";
        }
        return "Directory can only contain letters, numbers, forward slashes, and hyphens";
      }
      return "";
    }

    return "";
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Training Configuration
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={settings.advancedMode}
              onChange={(e) => handleSettingChange('advancedMode', e.target.checked)}
              color="primary"
            />
          }
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <TuneIcon />
              <Typography>Advanced Mode</Typography>
            </Stack>
          }
        />
      </Box>

      <Grid container spacing={3}>

        {/* Model Name Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SaveIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Model Name</Typography>
                <Tooltip title="Name for the fine-tuned model">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                required
                error={!!validationMessages.finetuned_model_name}
                helperText={validationMessages.finetuned_model_name || "Enter a name for your fine-tuned model"}
                value={settings.finetuned_model_name}
                onChange={(e) => handleSettingChange('finetuned_model_name', e.target.value)}
                placeholder="e.g., my-custom-model-v1"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ModelTrainingIcon color="action" />
                    </InputAdornment>
                  ),
                  // Prevent paste with spaces
                  onPaste: (e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const cleanText = pastedText.replace(/[\s-]/g, '_');
                    handleSettingChange('finetuned_model_name', cleanText);
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Directory Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <FolderIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Processing Directory</Typography>
                <Tooltip title="Directory for model and processed files">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                required
                error={!!validationMessages.processed_file_full_path}
                helperText={validationMessages.processed_file_full_path || "Enter the full path for processing files"}
                value={settings.processed_file_full_path}
                onChange={(e) => handleSettingChange('processed_file_full_path', e.target.value)}
                placeholder="/path/to/processing/directory"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FolderIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LayersIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Dataset Split</Typography>
                <Tooltip title="Percentage distribution of your dataset for training, validation, and testing">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography color="textSecondary">
                      Training: {settings.train_split}%
                    </Typography>
                    <Typography color="textSecondary">
                      Validation: {settings.validation_split}%
                    </Typography>
                    <Typography color="textSecondary">
                      Test: {settings.test_split}%
                    </Typography>
                  </Box>
                </Grid>

                {/* Training Split */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Training Split
                  </Typography>
                  <Slider
                    value={settings.train_split}
                    onChange={(_, value) => {
                      const remaining = 100 - value;
                      const validationRatio = settings.validation_split / (settings.validation_split + settings.test_split);
                      const newValidation = Math.round(remaining * validationRatio);
                      const newTest = remaining - newValidation;

                      handleSettingChange('train_split', value);
                      handleSettingChange('validation_split', newValidation);
                      handleSettingChange('test_split', newTest);
                    }}
                    min={50}
                    max={90}
                    step={5}
                    marks={[
                      { value: 50, label: '50%' },
                      { value: 70, label: '70%' },
                      { value: 90, label: '90%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Grid>

                {/* Validation Split */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Validation Split
                  </Typography>
                  <Slider
                    value={settings.validation_split}
                    onChange={(_, value) => {
                      const maxAllowed = 100 - settings.train_split;
                      const actualValue = Math.min(value, maxAllowed);
                      handleSettingChange('validation_split', actualValue);
                      handleSettingChange('test_split', maxAllowed - actualValue);
                    }}
                    min={5}
                    max={30}
                    step={5}
                    marks={[
                      { value: 5, label: '5%' },
                      { value: 20, label: '20%' },
                      { value: 30, label: '30%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Grid>

                {/* Test Split */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Test Split
                  </Typography>
                  <Slider
                    value={settings.test_split}
                    onChange={(_, value) => {
                      const maxAllowed = 100 - settings.train_split;
                      const actualValue = Math.min(value, maxAllowed);
                      handleSettingChange('test_split', actualValue);
                      handleSettingChange('validation_split', maxAllowed - actualValue);
                    }}
                    min={5}
                    max={30}
                    step={5}
                    marks={[
                      { value: 5, label: '5%' },
                      { value: 10, label: '10%' },
                      { value: 30, label: '30%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Grid>

                {/* Total Validation */}
                <Grid item xs={12}>
                  {settings.train_split + settings.validation_split + settings.test_split !== 100 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      Total split must equal 100%. Current total: {settings.train_split + settings.validation_split + settings.test_split}%
                    </Alert>
                  )}
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Recommended split: 70% Training, 20% Validation, 10% Test
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Training Iterations Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Training Iterations</Typography>
                <Tooltip title="Total number of training iterations">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Slider
                value={typeof settings.num_iterations === 'number' ? settings.num_iterations : 1000}
                onChange={(_, value) => handleSettingChange('num_iterations', value)}
                min={100}
                max={5000}
                step={100}
                marks={[
                  { value: 100, label: '100' },
                  { value: 1000, label: '1000' },
                  { value: 5000, label: '5000' }
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="textSecondary" mt={1}>
                Current: {typeof settings.num_iterations === 'number' ? settings.num_iterations : 1000} iterations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Batch Size Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LayersIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Batch Size</Typography>
                <Tooltip title="Number of samples processed together">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl fullWidth>
                <Select
                  value={settings.batch_size}
                  onChange={(e) => handleSettingChange('batch_size', e.target.value)}
                >
                  {batchSizeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12}>
          <Collapse in={settings.advancedMode}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Advanced Configuration
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <MemoryIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">Learning Rate</Typography>
                          <Tooltip title="Step size for model updates">
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <HelpOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <FormControl fullWidth>
                          <Select
                            value={settings.learning_rate}
                            onChange={(e) => handleSettingChange('learning_rate', e.target.value)}
                          >
                            {learningRateOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <LayersIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">Evaluation Frequency</Typography>
                          <Tooltip title="Number of steps between evaluations">
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <HelpOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <FormControl fullWidth>
                          <Select
                            value={settings.steps_per_eval}
                            onChange={(e) => handleSettingChange('steps_per_eval', e.target.value)}
                          >
                            <MenuItem value={50}>Every 50 steps</MenuItem>
                            <MenuItem value={100}>Every 100 steps (Recommended)</MenuItem>
                            <MenuItem value={200}>Every 200 steps</MenuItem>
                            <MenuItem value={500}>Every 500 steps</MenuItem>
                          </Select>
                        </FormControl>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <LayersIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">Number of Layers</Typography>
                          <Tooltip title="Number of layers to fine-tune">
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <HelpOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <TextField
                          fullWidth
                          type="number"
                          value={settings.num_layers}
                          onChange={(e) => handleSettingChange('num_layers', e.target.value)}
                          helperText="Default: 16"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography>
                      These settings determine how your model will be trained. The default values are optimized for most use cases.
                      Enable Advanced Mode for more control over the training process.
                    </Typography>
                  </Alert>
                </Grid>
              </CardContent>
            </Card>
          </Collapse>

        </Grid>
      </Grid>


    </Box>
  );
}

export default FineTuneSettings;
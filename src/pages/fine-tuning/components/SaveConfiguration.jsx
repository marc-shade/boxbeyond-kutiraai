// src/components/SaveConfiguration.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { GlassmorphicPaper } from 'themes/GlassmorphicComponents';

function SaveConfiguration({ 
  configName, 
  onConfigNameChange, 
  error, 
  isSaving, 
  formData 
}) {
  return (
    <Box>
      <GlassmorphicPaper sx={{ p: 3, mb: 3 }}>
        <Box component="form" noValidate>
          <TextField
            fullWidth
            label="Configuration Name"
            required
            value={configName}
            onChange={(e) => onConfigNameChange(e.target.value)}
            sx={{ mb: 3 }}
            helperText="Enter a unique name for this configuration"
            disabled={isSaving}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {isSaving && (
            <Box display="flex" justifyContent="center" mb={2}>
              <CircularProgress size={24} />
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Selected Model: {formData.baseModel?.id || formData.baseModel || 'None'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Selected Dataset ID: {formData.dataset?.id || 'None'}
            </Typography>
          </Box>
        </Box>
      </GlassmorphicPaper>
    </Box>
  );
}

export default SaveConfiguration;

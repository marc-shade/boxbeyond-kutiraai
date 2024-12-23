// src/components/ConfirmationDialog.jsx
import React from 'react';
import {
  Button,
  Typography,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { GlassmorphicDialog, GlassmorphicDialogActions, GlassmorphicDialogTitle, GlassmorphicDialogContent } from 'themes/GlassmorphicComponents';

function ConfirmationDialog({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  content, 
  loading,
  config 
}) {
  return (
    <GlassmorphicDialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <GlassmorphicDialogTitle sx={{ pb: 1 }}>
        {title}
      </GlassmorphicDialogTitle>
      <Divider />
      <GlassmorphicDialogContent>
        <Typography>{content}</Typography>
        
        {config && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Configuration Details:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Model Name: {config.model_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Base Model: {config.base_model}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dataset ID: {config.dataset_id}
              </Typography>
            </Box>
          </Box>
        )}
      </GlassmorphicDialogContent>
      <GlassmorphicDialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
          autoFocus
        >
          {loading ? 'Launching...' : 'Launch Training'}
        </Button>
      </GlassmorphicDialogActions>
    </GlassmorphicDialog>
  );
}

export default ConfirmationDialog;

// components/FineTuneReview.jsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import { GlassmorphicPaper } from 'themes/GlassmorphicComponents';

function FineTuneReview({ formData }) {
  const formatValue = (value) => {
    if (typeof value === 'number') {
      if (value < 0.01) return value.toExponential(2);
      return value.toString();
    }
    return value;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Base Model Section */}
        <Grid item xs={12} md={6}>
          <GlassmorphicPaper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Selected Model
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{formData.baseModel?.id}</Typography>
              <Typography color="textSecondary" variant="body2">
                {formData.baseModel?.description}
              </Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {formData.baseModel?.tags?.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Box>
          </GlassmorphicPaper>
        </Grid>

        {/* Dataset Section */}
        <Grid item xs={12} md={6}>
          <GlassmorphicPaper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Selected Dataset
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{formData.dataset?.dataset_name}</Typography>
              <Typography color="textSecondary" variant="body2">
                Description: {formData.dataset?.dataset_desc}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Chip 
                label={`Status: ${formData.dataset?.dataset_status}`}
                color={formData.dataset?.dataset_status === 'Success' ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          </GlassmorphicPaper>
        </Grid>

        {/* Dataset Split Section */}
        <Grid item xs={12}>
          <GlassmorphicPaper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Dataset Split Configuration
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <GlassmorphicPaper variant="paper" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {formData.settings?.train_split}%
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Training Data
                  </Typography>
                </GlassmorphicPaper>
              </Grid>
              <Grid item xs={12} md={4}>
                <GlassmorphicPaper variant="paper" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {formData.settings?.validation_split}%
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Validation Data
                  </Typography>
                </GlassmorphicPaper>
              </Grid>
              <Grid item xs={12} md={4}>
                <GlassmorphicPaper variant="paper" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {formData.settings?.test_split}%
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Test Data
                  </Typography>
                </GlassmorphicPaper>
              </Grid>
            </Grid>
          </GlassmorphicPaper>
        </Grid>

        {/* Training Settings Section */}
        <Grid item xs={12}>
          <GlassmorphicPaper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Training Settings
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Training Iteration"
                      secondary={formatValue(formData.settings?.num_iterations)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Batch Size"
                      secondary={formatValue(formData.settings?.batch_size)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Model Name"
                      secondary={formatValue(formData.settings?.finetuned_model_name)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Processing Directory"
                      secondary={formatValue(formData.settings?.processed_file_full_path)}
                    />
                  </ListItem>
                </List>
              </Grid>
              {formData.settings?.advancedMode && (
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Learning Rate"
                        secondary={formatValue(formData.settings?.learning_rate)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Evaluation Frequency"
                        secondary={formatValue(formData.settings?.steps_per_eval)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Number of Layers"
                        secondary={formatValue(formData.settings?.num_layers)}
                      />
                    </ListItem>
                  </List>
                </Grid>
              )}
            </Grid>
          </GlassmorphicPaper>
        </Grid>
      </Grid>

      <Alert severity="warning" sx={{ mt: 3 }}>
        Please review all settings carefully. The training process cannot be modified once started.
      </Alert>
    </Box>
  );
}

export default FineTuneReview;

import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { green } from '@mui/material/colors';

function FineTuneNotification() {
  return (
    <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 60, color: green[500], mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Fine-Tuning Process Completed
        </Typography>
        <Typography variant="body1">
          Your model has been successfully fine-tuned and is now ready for use.
        </Typography>
      </Box>
    </Paper>
  );
}

export default FineTuneNotification;
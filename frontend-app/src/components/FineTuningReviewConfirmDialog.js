import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

const FineTuningReviewConfirmDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Typography variant="h6">Confirm LLM Fine-Tuning Process</Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant='body2' sx={{mb: 2}}>
            You are about to start the fine-tuning process for your Large Language Model (LLM). Please be aware of the following:
          </Typography>
          <Typography variant='caption'>
            <li>This process can take a significant amount of time, depending on your model size, dataset and system resources.</li>
            <li>Fine-tuning requires substantial computational resources, including CPU, GPU, and memory.</li>
            <li>Your system's performance may be impacted during this process, and it's recommended not to run other resource-intensive tasks simultaneously.</li>
            <li>Ensure your device is connected to a stable power source and has adequate cooling.</li>
            <li>The process cannot be easily paused or resumed, so please make sure you can allow it to run uninterrupted.</li>
          </Typography>
          <Typography variant='body2' sx={{mt: 2}}>
            Are you sure you want to proceed with the fine-tuning process?
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          Proceed with Fine-Tuning
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FineTuningReviewConfirmDialog;
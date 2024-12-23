import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Radio, RadioGroup, FormControlLabel, FormLabel, Box,
  Typography,
  styled
} from '@mui/material';

import {
  GlassmorphicDialog,
  GlassmorphicDialogTitle,
  GlassmorphicDialogContent,
  GlassmorphicDialogActions
} from 'themes/GlassmorphicComponents';

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  width: '500px',
  '& .MuiTextField-root': {
    marginBottom: theme.spacing(2),
  },
}));

const FieldDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
}));

const NewDatasetForm = ({ open, onClose, onSubmit }) => {
  const [dataset, setDataset] = useState({
    dataset_name: '',
    dataset_desc: '',
    dataset_domain: '',
    dataset_origin: 'local',
    dataset_filepath: '',
    dataset_workflow_url: '',
    dataset_model_template: '',
    dataset_system_prompt: '',
  });

  const handleChange = (e) => {
    setDataset({ ...dataset, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (event) => {
    setDataset({
      ...dataset,
      dataset_origin: event.target.value
    });
  };

  const handleSubmit = () => {
    onSubmit(dataset);
    onClose();
  };


  return (
    <GlassmorphicDialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle><Typography variant="h5" fontWeight="bold">Create New Dataset</Typography></DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="dataset_name"
          label="Name"
          type="text"
          fullWidth
          variant="outlined"
          value={dataset.dataset_name}
          onChange={handleChange}
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
          value={dataset.dataset_desc}
          onChange={handleChange}
          required
        />
        <FieldDescription>Provide a brief description of the dataset's content and purpose.</FieldDescription>

        <TextField
          margin="dense"
          name="dataset_domain"
          label="Dataset Domain"
          type="text"
          fullWidth
          variant="outlined"
          value={dataset.dataset_domain}
          onChange={handleChange}
          required
        />
        <FieldDescription>Specify the domain or category this dataset belongs to (e.g., "Finance", "Healthcare").</FieldDescription>

        <Box mb={2}>
          <FormLabel component="legend"><Typography fontWeight="bold">Select Dataset Origin</Typography></FormLabel>
          <RadioGroup row name="dataset_origin" value={dataset.dataset_origin} onChange={handleRadioChange}>
            <FormControlLabel value="local" control={<Radio />} label="Local Drive" />
            <FormControlLabel value="google" control={<Radio />} label="Google Drive" />
          </RadioGroup>
        </Box>
        <FieldDescription>Choose the source location of your dataset files.</FieldDescription>

        {dataset.dataset_origin === 'local' && (
          <>
            <TextField
              margin="dense"
              name="dataset_filepath"
              label="Dataset Local Filepath"
              type="text"
              fullWidth
              variant="outlined"
              value={dataset.dataset_filepath}
              onChange={handleChange}
              required
            />
            <FieldDescription>Enter the full path to your dataset files on your local machine.</FieldDescription>
          </>
        )}

        <TextField
          margin="dense"
          name="dataset_workflow_url"
          label="Process Workflow URL"
          type="text"
          fullWidth
          variant="outlined"
          value={dataset.dataset_workflow_url}
          onChange={handleChange}
          required
        />
        <FieldDescription>Provide the URL for the workflow used to process this dataset.</FieldDescription>

        <TextField
          margin="dense"
          name="dataset_model_template"
          label="Model Template"
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={dataset.dataset_model_template}
          onChange={handleChange}
          required
        />
        <FieldDescription>Enter the template used for the LLM model associated with this dataset.</FieldDescription>

        <TextField
          margin="dense"
          name="dataset_system_prompt"
          label="System Prompt Template"
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={dataset.dataset_system_prompt}
          onChange={handleChange}
        />
        <FieldDescription>Specify the system prompt template used for this dataset (optional).</FieldDescription>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Create
        </Button>
      </DialogActions>
    </GlassmorphicDialog>
  );
};

export default NewDatasetForm;
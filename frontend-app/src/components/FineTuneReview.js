import React from 'react';
import { Paper, Typography, Box, Grid2 } from '@mui/material';

const LabelValuePair = ({ label, value }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {label}:
        </Typography>
        <Typography variant="body1">{value}</Typography>
    </Box>
);

const FineTuneReview = ({ formData }) => {
    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Review Your Selections</Typography>
            <Grid2 container spacing={2}>
                <Grid2 item sx={{ width: '100%' }}>
                    <LabelValuePair label="Selected Model" value={formData.selectedModel} />
                </Grid2>
            </Grid2>
            <Grid2 container spacing={2}>
                <Grid2 item sx={{ width: '100%' }}>
                    <LabelValuePair label="Dataset Id" value={formData.dataset_id} />
                </Grid2>
            </Grid2>
            <Grid2 container spacing={2}>
                <Grid2 item sx={{ width: '100%' }}>
                    <LabelValuePair label="Dataset Test %" value={formData.test_percent} />
                </Grid2>
            </Grid2>
            <Grid2 container spacing={2}>
                <Grid2 item sx={{ width: '100%' }}>
                    <LabelValuePair label="Dataset Validation %" value={formData.validation_percent} />
                </Grid2>
            </Grid2>
            <Grid2 container spacing={2}>
                <Grid2 item sx={{ width: '100%' }}>
                    <LabelValuePair label="Model Owner" value={formData.selectedOwner} />
                </Grid2>
            </Grid2>
            <Grid2 container spacing={2}>
                <Grid2 item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Settings:</Typography>
                    <LabelValuePair label="Number of Iterations" value={formData.settings.num_iterations} />
                    <LabelValuePair label="Steps Per Evaluation" value={formData.settings.steps_per_eval} />
                    <LabelValuePair label="Number of layers to fine-tune" value={formData.settings.num_layers} />
                    <LabelValuePair label="Learning Rate" value={formData.settings.learning_rate} />
                    <LabelValuePair label="Number of validation batches" value={formData.settings.batch_size} />
                    <LabelValuePair label="Name of the fine tuned model" value={formData.settings.finetuned_model_name} />
                    <LabelValuePair label="Processed File Path" value={formData.settings.processed_file_full_path} />
                </Grid2>
            </Grid2>
        </Paper>
    );
};

export default FineTuneReview;
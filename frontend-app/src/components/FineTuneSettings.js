import React from 'react';
import {
    Box,
    TextField,
    Grid2,
    Paper,
} from '@mui/material';

const FineTuneSettings = ({ formData }) => {

    const [numberOfIterations, setNumberOfIterations] = React.useState(formData?.settings?.num_iterations);
    const [stepPerEval, setStepPerEval] = React.useState(formData?.settings?.steps_per_eval);
    const [numberOfLayers, setNumberOfLayers] = React.useState(formData?.settings?.num_layers);
    const [learningRate, setLearningRate] = React.useState(formData?.settings?.learning_rate);
    const [batchSize, setBatchSize] = React.useState(formData?.settings?.batch_size);
    const [finetunedModelName, setFinetunedModelName] = React.useState(formData?.settings?.finetuned_model_name);
    const [processedFileFullPath, setProcessedFileFullPath] = React.useState(formData?.settings?.processed_file_full_path);
    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ width: '80%', margin: 'auto' }}>
                <Grid2 container spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Grid2 item sx={{ width: '50%' }}>
                        <TextField
                            id="outlined-helperText"
                            label="Number of Iterations"
                            value={numberOfIterations}
                            helperText="Iterations to train for. Default is 1000."
                            variant='standard'
                            onChange={(e) => {
                                setNumberOfIterations(e.target.value);
                                formData.settings.num_iterations = e.target.value
                            }}
                        />
                    </Grid2>
                    <Grid2 item>
                        <TextField
                            id="outlined-helperText"
                            label="Steps Per Evaluation"
                            value={stepPerEval}
                            helperText="Number of training steps between validations"
                            variant='standard'
                            onChange={(e) => {
                                setStepPerEval(e.target.value);
                                formData.settings.steps_per_eval = e.target.value
                            }}
                        />
                    </Grid2>
                </Grid2>
                <Grid2 container spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Grid2 item sx={{ width: '50%' }}>
                        <TextField
                            id="outlined-helperText"
                            label="Number of layers to fine-tune"
                            value={numberOfLayers}
                            helperText="Default is 16."
                            variant='standard'
                            onChange={(e) => {
                                setNumberOfLayers(e.target.value);
                                formData.settings.num_layers = e.target.value
                            }}
                        />
                    </Grid2>
                    <Grid2 item>
                        <TextField
                            id="outlined-helperText"
                            label="Learning Rate"
                            value={learningRate}
                            helperText="Adam learning rate. Default is 1e-5"
                            variant='standard'
                            onChange={(e) => {
                                setLearningRate(e.target.value);
                                formData.settings.learning_rate = e.target.value
                            }}
                        />
                    </Grid2>
                </Grid2>
                <Grid2 container spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Grid2 item sx={{ width: '50%' }}>
                        <TextField
                            id="outlined-helperText"
                            label="Number of validation batches"
                            value={batchSize}
                            helperText="Default is 25, -1 uses the entire validation set."
                            variant='standard'
                            onChange={(e) => {
                                setBatchSize(e.target.value);
                                formData.settings.batch_size = e.target.value
                            }}
                        />
                    </Grid2>
                    <Grid2 item>
                        <TextField
                            id="outlined-helperText"
                            label="Name of the fine tuned model"
                            value={finetunedModelName}
                            helperText="Name used for inference."
                            variant='standard'
                            onChange={(e) => {
                                setFinetunedModelName(e.target.value);
                                formData.settings.finetuned_model_name = e.target.value
                            }}
                        />
                    </Grid2>
                </Grid2>
                <Grid2 container spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Grid2 item sx={{ width: '50%' }}>
                    <TextField
                            id="outlined-helperText"
                            label="Processed File Path"
                            value={processedFileFullPath}
                            helperText="Full path where model, interim processed files need to reside."
                            variant='standard'
                            fullWidth
                            onChange={(e) => {
                                setProcessedFileFullPath(e.target.value);
                                formData.settings.processed_file_full_path = e.target.value
                            }}
                        />
                    </Grid2>
                </Grid2>
            </Box>
        </Paper>
    );
};

export default FineTuneSettings;
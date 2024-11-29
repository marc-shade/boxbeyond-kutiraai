import React, { useState } from 'react';
import {
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Container,
    Box,
} from '@mui/material';

import FineTuneSettings from '../components/FineTuneSettings';
import FineTuneProcessSteps from '../components/FineTuneProcessSteps';
import FineTuneReview from '../components/FineTuneReview';
import FineTuneChooseDataset from '../components/FineTuneChooseDataset';
import FineTuneNotification from '../components/FineTuneNotification';
import MLXCommunityModels from '../components/MLXCommunityModels';
import FineTuningReviewConfirmDialog from '../components/FineTuningReviewConfirmDialog';

const steps = [
    'Choose Model',
    'Choose Dataset',
    'Settings',
    'Review',
    'Process',
    'Complete'
];

function FineTunePage() {
    const [activeStep, setActiveStep] = useState(0);
    const [reviewConfirmDialogOpen, setReviewConfirmDialogOpen] = useState(false);
    const [formData] = useState({
        selectedModel: '',
        dataset_id: '',
        settings: {
            'num_iterations': "1000",
            'steps_per_eval': "10",
            'num_layers': "16",
            'learning_rate': '1e-5',
            'batch_size': "25",
            'finetuned_model_name': 'my_finetuned_model',
            'processed_file_full_path': '',
        },
    });
    const [enabledNextButton, setEnableNextButton] = useState(true);

    const handleNext = () => {
        if (evaluateNextStep()) {
            if (activeStep === 3) {
                setReviewConfirmDialogOpen(true);
            } else {
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReviewConfirmDialogClose = () => {
        setReviewConfirmDialogOpen(false);
    };

    const handleReviewConfirmFineTuning = () => {
        setReviewConfirmDialogOpen(false);
        // Proceed to the next step or start the fine-tuning process
        setActiveStep((prevStep) => prevStep + 1);
    };

    const evaluateNextStep = () => {
        console.log(formData);
        if (activeStep === 0 && formData.selectedModel) {
            return true;
        } else if (activeStep === 0 && !formData.selectedModel) {
            return false;
        } else if (activeStep === 1 && formData.dataset_id) {
            return true;
        } else if (activeStep === 1 && !formData.dataset_id) {
            return false;
        } else if (activeStep === 2 && !formData.settings.processed_file_full_path) {
            return false;
        } else {
            return true;
        }
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return <MLXCommunityModels formData={formData} />;
            case 1:
                return <FineTuneChooseDataset formData={formData} />;
            case 2:
                return <FineTuneSettings formData={formData} />;
            case 3:
                return <FineTuneReview formData={formData} />;
            case 4:
                return <FineTuneProcessSteps formData={formData} />;
            case 5:
                return <FineTuneNotification />;
            default:
                return 'Unknown step';
        }
    };


    return (
        <Container sx={{ mt: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <Box mt={4}>
                {activeStep === steps.length ? (
                    <Typography>All steps completed</Typography>
                ) : (
                    <>
                        {getStepContent(activeStep)}
                        <Box mt={2} display="flex" justifyContent='space-between'>
                            <Button
                                disabled={activeStep === 0}
                                onClick={handleBack}
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNext}
                                disabled={!enabledNextButton}
                            >
                                {activeStep === steps.length - 1 ? 'Finish' : activeStep === 3 ? 'Start Fine-Tuning' : 'Next'}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
            <FineTuningReviewConfirmDialog
                open={reviewConfirmDialogOpen}
                onClose={handleReviewConfirmDialogClose}
                onConfirm={handleReviewConfirmFineTuning}
            />
        </Container>
    );
}

export default FineTunePage;
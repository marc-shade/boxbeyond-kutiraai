// TaskDetailsDialog.jsx
import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    LinearProgress,
    Alert,
    Chip,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as PendingIcon,
    Error as ErrorIcon,
    PlayArrow as RunningIcon,
    Storage as DataIcon,
    Login as LoginIcon,
    ModelTraining as TrainingIcon,
    Build as BuildIcon,
    CloudUpload as UploadIcon
} from '@mui/icons-material';
import { finetuneService } from '../services/finetuneService';
import { GlassmorphicDialog } from 'themes/GlassmorphicComponents';

// Define the fine-tuning process steps
const FINE_TUNING_STEPS = [
    {
        id: 'PREPARING',
        label: 'Preparing',
        description: 'Initializing fine-tuning environment and validating configuration',
        icon: PendingIcon,
        estimatedTime: '30 seconds'
    },
    {
        id: 'DATASET_CREATION',
        label: 'Dataset Creation',
        description: 'Creating training, validation, and test datasets from your data',
        icon: DataIcon,
        estimatedTime: '1-2 minutes'
    },
    {
        id: 'HF_LOGIN',
        label: 'Model Access',
        description: 'Authenticating with Hugging Face and downloading base model',
        icon: LoginIcon,
        estimatedTime: '2-5 minutes'
    },
    {
        id: 'FINETUNING',
        label: 'Training',
        description: 'Running MLX fine-tuning with LoRA adapters on your dataset',
        icon: TrainingIcon,
        estimatedTime: '10-30 minutes'
    },
    {
        id: 'CREATING_MODEL',
        label: 'Model Creation',
        description: 'Creating Ollama-compatible model file with trained adapters',
        icon: BuildIcon,
        estimatedTime: '1-2 minutes'
    },
    {
        id: 'OLLAMA_IMPORT',
        label: 'Final Import',
        description: 'Importing the fine-tuned model into Ollama for use',
        icon: UploadIcon,
        estimatedTime: '1-2 minutes'
    }
];

// Helper function to get step status
const getStepStatus = (stepId, currentStatus, currentStep) => {
    const stepIndex = FINE_TUNING_STEPS.findIndex(step => step.id === stepId);
    const currentStepIndex = FINE_TUNING_STEPS.findIndex(step => step.id === currentStatus);

    if (currentStatus === 'FAILED') {
        return stepIndex <= currentStepIndex ? 'error' : 'pending';
    }
    if (currentStatus === 'COMPLETED') {
        return 'completed';
    }
    if (stepIndex < currentStepIndex) {
        return 'completed';
    }
    if (stepIndex === currentStepIndex) {
        return 'active';
    }
    return 'pending';
};

// Helper function to get step icon
const getStepIcon = (stepId, status) => {
    const step = FINE_TUNING_STEPS.find(s => s.id === stepId);
    const IconComponent = step?.icon || PendingIcon;

    switch (status) {
        case 'completed':
            return <CheckCircleIcon color="success" />;
        case 'active':
            return <RunningIcon color="primary" />;
        case 'error':
            return <ErrorIcon color="error" />;
        default:
            return <IconComponent color="disabled" />;
    }
};

function TaskDetailsDialog({ open, onClose, taskDetails: initialTaskDetails, configId, configName, loading }) {
    const [taskDetails, setTaskDetails] = useState(initialTaskDetails);
    const [pollingInterval, setPollingInterval] = useState(null);

    // Update local state when initial task details change
    useEffect(() => {
        console.log('Initial task details updated:', initialTaskDetails);
        setTaskDetails(initialTaskDetails);
    }, [initialTaskDetails]);

    // Polling effect with timeout
    useEffect(() => {
        let interval;
        let pollCount = 0;
        const maxPolls = 360; // 30 minutes at 5-second intervals

        const pollTaskStatus = async () => {
            try {
                pollCount++;
                console.log(`Polling attempt ${pollCount}/${maxPolls} for config:`, configId);

                const updatedTask = await finetuneService.getTaskStatus(configId);
                setTaskDetails(updatedTask);

                // Stop polling when we reach final states
                if (updatedTask.status === 'COMPLETED' || updatedTask.status === 'FAILED') {
                    console.log('Task reached final state, stopping polling');
                    clearInterval(interval);
                    return;
                }

                // Stop polling after timeout
                if (pollCount >= maxPolls) {
                    console.warn('Polling timeout reached, stopping polling');
                    clearInterval(interval);
                    // Optionally update task details to show timeout
                    setTaskDetails(prev => ({
                        ...prev,
                        error: 'Polling timeout - task may still be running in background'
                    }));
                }
            } catch (error) {
                console.error('Error polling task status:', error);
                clearInterval(interval);
            }
        };

        if (open && configId && taskDetails?.status !== 'COMPLETED' && taskDetails?.status !== 'FAILED') {
            console.log('Starting polling for config:', configId);
            pollCount = 0; // Reset counter
            // Initial poll
            pollTaskStatus();
            // Set up interval
            interval = setInterval(pollTaskStatus, 5000);
            setPollingInterval(interval);
        }

        return () => {
            if (interval) {
                console.log('Cleaning up polling interval');
                clearInterval(interval);
            }
        };
    }, [open, configId, taskDetails?.status]);

    return (
        <GlassmorphicDialog
            open={open}
            onClose={taskDetails?.status !== 'IN_PROGRESS' ? onClose : undefined}
            maxWidth="lg"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    height: '70vh',
                    maxHeight: '600px'
                }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">
                        Fine-tuning Progress: {configName}
                    </Typography>
                    {taskDetails && (
                        <Chip
                            label={taskDetails.status || 'Unknown'}
                            color={
                                taskDetails.status === 'COMPLETED' ? 'success' :
                                    taskDetails.status === 'FAILED' ? 'error' :
                                        'primary'
                            }
                            variant="outlined"
                        />
                    )}
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3, height: '100%', overflow: 'hidden' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress size={60} />
                    </Box>
                ) : taskDetails ? (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Compact Progress Header */}
                        <Box sx={{ mb: 3 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Chip
                                        label={taskDetails.status || 'N/A'}
                                        color={
                                            taskDetails.status === 'COMPLETED' ? 'success' :
                                                taskDetails.status === 'FAILED' ? 'error' :
                                                    'primary'
                                        }
                                        size="medium"
                                    />
                                    {taskDetails.current_step && (
                                        <Typography variant="body2" color="text.secondary">
                                            {taskDetails.status === 'FAILED' ? 'Failed at: ' : 'Currently: '}
                                            <strong>{taskDetails.current_step}</strong>
                                        </Typography>
                                    )}
                                </Box>
                                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                    {Math.round(taskDetails.progress || 0)}%
                                </Typography>
                            </Box>

                            {taskDetails.progress !== undefined && (
                                <LinearProgress
                                    variant="determinate"
                                    value={taskDetails.progress}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            )}
                        </Box>

                        {/* Horizontal Process Steps */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                Process Steps
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: 2,
                                mb: 2
                            }}>
                                {FINE_TUNING_STEPS.map((step, index) => {
                                    const stepStatus = getStepStatus(step.id, taskDetails.status, taskDetails.current_step);
                                    const isActive = stepStatus === 'active';

                                    return (
                                        <Card
                                            key={step.id}
                                            sx={{
                                                border: isActive ? 2 : 1,
                                                borderColor: isActive ? 'primary.main' : 'divider',
                                                bgcolor: isActive ? 'primary.50' : 'background.paper',
                                                height: '100px'
                                            }}
                                        >
                                            <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    {getStepIcon(step.id, stepStatus)}
                                                    {isActive && <CircularProgress size={16} />}
                                                </Box>
                                                <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 0.5 }}>
                                                    {step.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                                    {step.estimatedTime}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Bottom Section - Error and Metrics in Horizontal Layout */}
                        <Box sx={{ flex: 1, display: 'flex', gap: 2, minHeight: 0 }}>
                            {/* Error Display */}
                            {taskDetails.error && (
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Error Details
                                    </Typography>
                                    <Paper sx={{
                                        p: 2,
                                        bgcolor: 'error.50',
                                        height: '200px',
                                        overflow: 'auto',
                                        border: '1px solid',
                                        borderColor: 'error.light'
                                    }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                            {taskDetails.error}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}

                            {/* Training Metrics */}
                            {taskDetails.metrics && (
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Training Metrics
                                    </Typography>
                                    <Paper sx={{
                                        p: 2,
                                        bgcolor: 'grey.50',
                                        height: '200px',
                                        overflow: 'auto',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}>
                                        <pre style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.4 }}>
                                            {JSON.stringify(taskDetails.metrics, null, 2)}
                                        </pre>
                                    </Paper>
                                </Box>
                            )}

                            {/* If no error or metrics, show a placeholder */}
                            {!taskDetails.error && !taskDetails.metrics && (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Additional details will appear here when available
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                ) : (
                    <Box display="flex" justifyContent="center" p={3}>
                        <Typography>No task details available</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <Typography variant="caption" color="text.secondary">
                        {taskDetails?.status === 'COMPLETED' ? 'Fine-tuning completed successfully!' :
                         taskDetails?.status === 'FAILED' ? 'Fine-tuning failed. Check error details above.' :
                         'Updates automatically every 5 seconds'}
                    </Typography>
                    <Box display="flex" gap={1}>
                        {taskDetails?.status !== 'COMPLETED' && taskDetails?.status !== 'FAILED' && (
                            <Button
                                onClick={async () => {
                                    try {
                                        const updatedTask = await finetuneService.getTaskStatus(configId);
                                        setTaskDetails(updatedTask);
                                    } catch (error) {
                                        console.error('Error refreshing task status:', error);
                                    }
                                }}
                                variant="outlined"
                                size="small"
                            >
                                Refresh
                            </Button>
                        )}
                        <Button
                            onClick={onClose}
                            variant={taskDetails?.status === 'COMPLETED' || taskDetails?.status === 'FAILED' ? 'contained' : 'outlined'}
                            color={taskDetails?.status === 'COMPLETED' ? 'success' : 'primary'}
                        >
                            {taskDetails?.status === 'COMPLETED' || taskDetails?.status === 'FAILED' ? 'Close' : 'Keep Running in Background'}
                        </Button>
                    </Box>
                </Box>
            </DialogActions>
        </GlassmorphicDialog>
    );
}

export default TaskDetailsDialog;

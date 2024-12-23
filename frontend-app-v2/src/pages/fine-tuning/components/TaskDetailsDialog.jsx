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
    CircularProgress
} from '@mui/material';
import { finetuneService } from '../services/finetuneService';
import { GlassmorphicDialog } from 'themes/GlassmorphicComponents';

function TaskDetailsDialog({ open, onClose, taskDetails: initialTaskDetails, configId, configName, loading }) {
    const [taskDetails, setTaskDetails] = useState(initialTaskDetails);
    const [pollingInterval, setPollingInterval] = useState(null);

    // Update local state when initial task details change
    useEffect(() => {
        console.log('Initial task details updated:', initialTaskDetails);
        setTaskDetails(initialTaskDetails);
    }, [initialTaskDetails]);

    // Polling effect
    useEffect(() => {
        let interval;

        const pollTaskStatus = async () => {
            try {
                const updatedTask = await finetuneService.getTaskStatus(configId);
                setTaskDetails(updatedTask);

                // Stop polling only when we reach final states
                if (updatedTask.status === 'COMPLETED' || updatedTask.status === 'FAILED') {
                    console.log('Task reached final state, stopping polling');
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Error polling task status:', error);
                clearInterval(interval);
            }
        };
        if (open && configId && taskDetails?.status !== 'COMPLETED' && taskDetails?.status !== 'FAILED') {
            console.log('Starting polling for config:', configId);
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
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Fine-tuning Progress: {configName}
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : taskDetails ? (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            <strong>Status:</strong>
                            <Chip
                                label={taskDetails.status || 'N/A'}
                                color={
                                    taskDetails.status === 'COMPLETED' ? 'success' :
                                        taskDetails.status === 'FAILED' ? 'error' :
                                            taskDetails.status === 'IN_PROGRESS' ? 'primary' : 'default'
                                }
                                sx={{ ml: 1 }}
                            />
                        </Typography>

                        {taskDetails.current_step && (
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Current Step:</strong> {taskDetails.current_step}
                            </Typography>
                        )}

                        {taskDetails.progress !== undefined && (
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Progress
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={taskDetails.progress}
                                    sx={{ mt: 1 }}
                                />
                                <Typography variant="body2" color="text.secondary" align="right">
                                    {Math.round(taskDetails.progress)}%
                                </Typography>
                            </Box>
                        )}

                        {taskDetails.error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {taskDetails.error}
                            </Alert>
                        )}

                        {taskDetails.metrics && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    <strong>Metrics:</strong>
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <pre>{JSON.stringify(taskDetails.metrics, null, 2)}</pre>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box display="flex" justifyContent="center" p={3}>
                        <Typography>No task details available</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    disabled={taskDetails?.status === 'IN_PROGRESS'}
                >
                    Close
                </Button>
            </DialogActions>
        </GlassmorphicDialog>
    );
}

export default TaskDetailsDialog;

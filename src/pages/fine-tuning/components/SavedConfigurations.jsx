// SavedConfigurations.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TaskDetailsDialog from './TaskDetailsDialog';
import { finetuneService } from '../services/finetuneService';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';

function SavedConfigurations({ savedConfigurations, onEdit, onDelete, onLaunch, loading, launchingConfigId, refreshing }) {
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [taskErrors, setTaskErrors] = useState({}); // Store error messages by config ID

  // Fetch error details for failed configurations
  useEffect(() => {
    const fetchErrorDetails = async () => {
      const failedConfigs = savedConfigurations.filter(config => config.status === 'Failed');
      const errors = {};

      for (const config of failedConfigs) {
        try {
          const taskData = await finetuneService.getTaskStatus(config.id);
          if (taskData && taskData.error) {
            errors[config.id] = taskData.error;
          }
        } catch (error) {
          console.error(`Failed to fetch error for config ${config.id}:`, error);
        }
      }

      setTaskErrors(errors);
    };

    if (savedConfigurations.length > 0) {
      fetchErrorDetails();
    }
  }, [savedConfigurations]);

  const handleViewProgress = async (config) => {
    setSelectedConfig(config);
    setTaskDetailsOpen(true);
    setIsLoadingTask(true);

    try {
      const taskData = await finetuneService.getTaskStatus(config.id);
      setTaskDetails(taskData);
    } catch (error) {
      console.error('Error fetching task details:', error);
      // Handle error - maybe show a snackbar
    } finally {
      setIsLoadingTask(false);
    }
  };

  const handleCloseTaskDetails = () => {
    setTaskDetailsOpen(false);
    setSelectedConfig(null);
    setTaskDetails(null);
  };

  return (
    <Box>
      {refreshing && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={16} />
            <Typography variant="body2">
              Refreshing configurations...
            </Typography>
          </Box>
        </Alert>
      )}

      <GlassmorphicCard component={TableContainer} variant="card">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model Name</TableCell>
              <TableCell>Base Model</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {savedConfigurations.map((config) => (
              <TableRow key={config.id}>
                <TableCell>{config.model_name}</TableCell>
                <TableCell>{config.base_model}</TableCell>
                <TableCell>
                  <Typography variant="subtitle1" gutterBottom>
                    {config.status === 'Failed' && taskErrors[config.id] ? (
                      <Tooltip
                        title={
                          <Box sx={{ maxWidth: 400 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Error Details:
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {taskErrors[config.id]}
                            </Typography>
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <Chip
                          label={config.status || 'N/A'}
                          sx={{
                            ml: 1,
                            backgroundColor: (theme) => theme.palette.error.dark,
                            color: (theme) => theme.palette.error.contrastText,
                            fontWeight: 'medium',
                            cursor: 'help'
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Chip
                        label={config.status || 'N/A'}
                        sx={{
                          ml: 1,
                          backgroundColor: (theme) => {
                            switch (config.status) {
                              case 'Completed':
                                return theme.palette.success.dark;
                              case 'Failed':
                                return theme.palette.error.dark;
                              case 'In Progress':
                                return theme.palette.primary.dark;
                              case 'Pending':
                                return theme.palette.warning.dark;
                              default:
                                return theme.palette.grey[300];
                            }
                          },
                          color: (theme) => {
                            switch (config.status) {
                              case 'Completed':
                                return theme.palette.success.contrastText;
                              case 'Failed':
                                return theme.palette.error.contrastText;
                              case 'In Progress':
                                return theme.palette.primary.contrastText;
                              case 'Pending':
                                return theme.palette.warning.contrastText;
                              default:
                                return theme.palette.grey[800];
                            }
                          },
                          fontWeight: 'medium'
                        }}
                      />
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(config.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {config.status === 'In Progress' ? (
                    // Show only View Progress when in progress
                    <Tooltip title="View Progress">
                      <IconButton
                        onClick={() => handleViewProgress(config)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    // Show regular actions when not in progress
                    <>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => onEdit(config)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Launch Training">
                        <IconButton
                          onClick={() => onLaunch(config)}
                          disabled={loading || launchingConfigId === config.id}
                        >
                          {launchingConfigId === config.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <PlayArrowIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => onDelete(config)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassmorphicCard>

      <TaskDetailsDialog
        open={taskDetailsOpen}
        onClose={handleCloseTaskDetails}
        taskDetails={taskDetails}
        configId={selectedConfig?.id}
        configName={selectedConfig?.model_name}
        loading={isLoadingTask}
      />
    </Box>
  );
}

export default SavedConfigurations;

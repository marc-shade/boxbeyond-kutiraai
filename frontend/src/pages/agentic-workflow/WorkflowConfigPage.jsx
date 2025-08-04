import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  Paper,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  DialogContentText,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Breadcrumbs,
  Link,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { GlassmorphicPaper, GlassmorphicBox, GlassmorphicCard, GlassmorphicContainer } from 'themes/GlassmorphicComponents';

const WorkflowConfigPage = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [agents, setAgents] = useState({});
  const [tasks, setTasks] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch workflow data
    const fetchWorkflow = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8100/workflows/${workflowId}`);
        const data = await response.json();
        setWorkflow(data);

        // Transform existing agents into our state format
        if (data.agents) {
          const transformedAgents = Object.entries(data.agents).reduce((acc, [agentKey, agentData]) => {
            acc[`agent-${agentKey}`] = {
              id: `agent-${agentKey}`,
              name: agentKey, // Use the key as the name
              role: agentData.role || '',
              goal: agentData.goal || '',
              backstory: agentData.backstory || '',
              verbose: agentData.verbose ?? true,
              allow_delegation: agentData.allow_delegation ?? false,
              temperature: agentData.temperature ?? 0.5,
              max_iter: agentData.max_iter ?? 1
            };
            return acc;
          }, {});
          setAgents(transformedAgents);

          // Set the first agent as selected if any exist
          const firstAgentId = Object.keys(transformedAgents)[0];
          if (firstAgentId) {
            setSelectedAgent(firstAgentId);
          }
        }

        // Transform existing tasks into our state format
        if (data.tasks && data.tasks.length > 0) {
          const transformedTasks = data.tasks.map((task, index) => {
            // Find the agent ID based on the agent name
            const agentId = Object.entries(agents).find(
              ([_, agent]) => agent.name.toLowerCase() === task.agent.toLowerCase()
            )?.[0];

            return {
              id: `task-${index}`,
              agentId: `agent-${task.agent}`, // Create ID based on agent name
              name: task.name || '',
              description: task.description || '',
              expected_output: task.expected_output || '',
              inputs: extractInputsFromDescription(task.description)
            };
          });
          setTasks(transformedTasks);
        }

      } catch (error) {
        console.error('Error fetching workflow:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflow();
  }, [workflowId]);

  // Add error handling
  const [error, setError] = useState(null);

  // Helper function to extract input variables from description
  const extractInputsFromDescription = (description) => {
    if (!description) return [];
    const matches = description.match(/{([^}]+)}/g) || [];
    return matches.map(match => match.replace(/{|}/g, ''));
  };

  // Add some visual feedback after deletion
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleDelete = () => {
    performDelete();
    setSnackbar({
      open: true,
      message: `${deleteDialog.type === 'agent' ? 'Agent' : 'Task'} deleted successfully`,
      severity: 'success'
    });
  };

  // Update handleAddAgent to ensure unique names
  const handleAddAgent = () => {
    const newAgentId = `agent-${Date.now()}`;
    setAgents(prev => ({
      ...prev,
      [newAgentId]: {
        id: newAgentId,
        name: `Agent${Object.keys(prev).length + 1}`, // Default name
        role: '',
        goal: '',
        backstory: '',
        verbose: true,
        allow_delegation: false,
        temperature: 0.5,
        max_iter: 1
      }
    }));
    setSelectedAgent(newAgentId);
    setSelectedTask(null);
  };

  // Add validation for unique agent names
  const handleAgentChange = (agentId, field, value) => {
    if (field === 'name') {
      // Check if name is already taken
      const isNameTaken = Object.values(agents).some(
        agent => agent.id !== agentId && agent.name.toLowerCase() === value.toLowerCase()
      );
      if (isNameTaken) {
        // Show error message or handle duplicate name
        alert('An agent with this name already exists');
        return;
      }
    }

    setAgents(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [field]: value
      }
    }));
  };

  const handleAddTask = (agentId) => {
    const newTask = {
      id: `task-${Date.now()}`,
      agentId,
      name: '',
      description: '',
      expected_output: '',
      inputs: []
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask.id);
  };

  // Update task handling to maintain agent references
  const handleTaskChange = (taskId, field, value) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, [field]: value };

        // If description is updated, extract inputs
        if (field === 'description') {
          updatedTask.inputs = extractInputsFromDescription(value);
        }

        return updatedTask;
      }
      return task;
    }));
  };

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  const handleSave = async () => {
    try {
      // Validate required fields
      const hasEmptyAgents = Object.values(agents).some(agent =>
        !agent.name || !agent.role || !agent.goal || !agent.backstory
      );

      const hasEmptyTasks = tasks.some(task =>
        !task.name || !task.description || !task.expected_output
      );

      if (hasEmptyAgents || hasEmptyTasks) {
        // Show error message to user
        alert('Please fill in all required fields for agents and tasks');
        return;
      }
      // Transform agents data - use name as key
      const transformedAgents = Object.values(agents).reduce((acc, agent) => {
        // Remove id from agent and use name as key
        const { id, name, ...agentDetails } = agent;
        acc[name.toLowerCase()] = {
          ...agentDetails,
          name // Keep the original name in the value
        };
        return acc;
      }, {});

      // Transform tasks data
      const transformedTasks = tasks.map(task => {
        // Get the agent name for this task using agentId
        const agentName = agents[task.agentId]?.name.toLowerCase();

        return {
          name: task.name,
          description: task.description,
          agent: agentName,
          expected_output: task.expected_output || '' // Include if you have this field
        };
      });

      // Prepare the updated workflow data
      const updatedWorkflow = {
        ...workflow,
        agents: transformedAgents,
        tasks: transformedTasks
      };

      // Make the API call
      const response = await fetch(`http://localhost:8100/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedWorkflow)
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow configuration');
      }

      // Navigate back to workflow detail page on success
      navigate(`/agentic/workflow`);
    } catch (error) {
      console.error('Error saving configuration:', error);
      // You might want to show an error message to the user here
    }
  };

  const performDelete = () => {
    const { type, id } = deleteDialog;
    
    if (type === 'agent') {
      setAgents(prev => {
        const newAgents = { ...prev };
        delete newAgents[id];
        return newAgents;
      });
  
      setTasks(prev => prev.filter(task => task.agentId !== id));
  
      if (selectedAgent === id) {
        setSelectedAgent(null);
        setSelectedTask(null);
      }
    } else if (type === 'task') {
      setTasks(prev => prev.filter(task => task.id !== id));
      if (selectedTask === id) {
        setSelectedTask(null);
      }
    }
  
    setDeleteDialog({ open: false, type: null, id: null });
    setHasChanges(true); // Mark that there are unsaved changes
  };

  const handleDeleteAgent = (agentId) => {
    setDeleteDialog({
      open: true,
      type: 'agent',
      id: agentId
    });
  };

  // Add this helper function to insert text at cursor position
  const insertTextAtCursor = (text, originalText, selectionStart, selectionEnd) => {
    return originalText.substring(0, selectionStart) + text + originalText.substring(selectionEnd);
  };

  // Update the tasks section with cursor position tracking
  const [cursorPosition, setCursorPosition] = useState({
    start: 0,
    end: 0
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: null, // 'agent' or 'task'
    id: null
  });



  const DeleteConfirmationDialog = () => (
    <Dialog
      open={deleteDialog.open}
      onClose={() => setDeleteDialog({ open: false, type: null, id: null })}
    >
      <DialogTitle>
        Confirm Delete
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {deleteDialog.type === 'agent'
            ? 'Are you sure you want to delete this agent? All associated tasks will also be deleted.'
            : 'Are you sure you want to delete this task?'
          }
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setDeleteDialog({ open: false, type: null, id: null })}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            handleDelete();
            setDeleteDialog({ open: false, type: null, id: null });
          }}
          color="error"
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link
            component="button"
            onClick={() => navigate('/agentic/workflow/')}
            underline="hover"
          >
            Workflows
          </Link>
          <Link
            component="button"
            onClick={() => navigate(`/agentic/workflow/${workflowId}/config`)}
            underline="hover"
          >
            {workflow?.name || 'Workflow'}
          </Link>
          <Typography color="text.primary">Configure Agents & Tasks</Typography>
        </Breadcrumbs>
      </Box>

      <Grid container spacing={3}>
        {/* Left Sidebar - Agents List */}
        <Grid item xs={3}>
          <GlassmorphicPaper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Agents</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddAgent}
                variant="contained"
                size="small"
              >
                Add Agent
              </Button>
            </Box>
            <List>
              {Object.values(agents).map((agent) => (
                <ListItem
                  key={agent.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent selecting agent when clicking delete
                        handleDeleteAgent(agent.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  button
                  selected={selectedAgent === agent.id}
                  onClick={() => {
                    setSelectedAgent(agent.id);
                    setSelectedTask(null);
                  }}
                >
                  <ListItemText
                    primary={agent.name || 'New Agent'}
                    secondary={agent.role}
                  />
                </ListItem>
              ))}
            </List>
          </GlassmorphicPaper>
        </Grid>

        {/* Main Content - Agent/Task Details */}
        <Grid item xs={9}>
          {selectedAgent && (
            <GlassmorphicPaper sx={{ p: 3 }}>
              {/* Agent Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Agent Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Agent Name"
                      value={agents[selectedAgent]?.name || ''}
                      onChange={(e) => handleAgentChange(selectedAgent, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={agents[selectedAgent]?.role || ''}
                      onChange={(e) => handleAgentChange(selectedAgent, 'role', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Goal"
                      value={agents[selectedAgent]?.goal || ''}
                      onChange={(e) => handleAgentChange(selectedAgent, 'goal', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Backstory"
                      value={agents[selectedAgent]?.backstory || ''}
                      onChange={(e) => handleAgentChange(selectedAgent, 'backstory', e.target.value)}
                    />
                  </Grid>

                  {/* Agent Configuration Section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 2, mt: 2 }}>Agent Configuration</Typography>
                  </Grid>

                  {/* Temperature Slider */}
                  <Grid item xs={6}>
                    <Tooltip title="Controls the randomness of the agent's responses. Higher values make the output more creative but less focused.">
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="caption" color="textSecondary">
                          Temperature: {agents[selectedAgent]?.temperature || 0.5}
                        </Typography>
                        <Slider
                          value={agents[selectedAgent]?.temperature || 0.5}
                          onChange={(_, value) => handleAgentChange(selectedAgent, 'temperature', value)}
                          step={0.1}
                          marks
                          min={0}
                          max={1}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    </Tooltip>
                  </Grid>

                  {/* Max Iterations */}
                  <Grid item xs={6}>
                    <Tooltip title="Maximum number of iterations the agent will perform for a task">
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Iterations"
                        value={agents[selectedAgent]?.max_iter || 1}
                        onChange={(e) => handleAgentChange(selectedAgent, 'max_iter', parseInt(e.target.value))}
                        InputProps={{
                          inputProps: { min: 1 }
                        }}
                      />
                    </Tooltip>
                  </Grid>

                  {/* Toggle Switches */}
                  <Grid item xs={6}>
                    <Tooltip title="Enable detailed output logging">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={agents[selectedAgent]?.verbose || false}
                            onChange={(e) => handleAgentChange(selectedAgent, 'verbose', e.target.checked)}
                          />
                        }
                        label="Verbose Mode"
                      />
                    </Tooltip>
                  </Grid>

                  <Grid item xs={6}>
                    <Tooltip title="Allow the agent to delegate tasks to other agents">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={agents[selectedAgent]?.allow_delegation || false}
                            onChange={(e) => handleAgentChange(selectedAgent, 'allow_delegation', e.target.checked)}
                          />
                        }
                        label="Allow Delegation"
                      />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Tasks Section */}
              <GlassmorphicBox>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Tasks</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddTask(selectedAgent)}
                    variant="outlined"
                  >
                    Add Task
                  </Button>
                </Box>

                <GlassmorphicContainer variant="Grid" container spacing={2} sx={{m:3}}>
                  {tasks
                    .filter(task => task.agentId === selectedAgent)
                    .map(task => (
                      <Grid item xs={12} key={task.id}>
                        <GlassmorphicCard
                          sx={{
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <CardContent>
                            <TextField
                              fullWidth
                              label="Task Name"
                              value={task.name}
                              onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              label="Expected Output"
                              value={task.expected_output}
                              onChange={(e) => handleTaskChange(task.id, 'expected_output', e.target.value)}
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              multiline
                              rows={4}
                              label="Description"
                              value={task.description}
                              helperText="Click on available inputs below to insert them into your description"
                              onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                              onSelect={(e) => {
                                const target = e.target;
                                setCursorPosition({
                                  start: target.selectionStart,
                                  end: target.selectionEnd
                                });
                              }}
                              sx={{ mb: 2 }}
                            />

                            {/* Workflow Inputs */}
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Available Inputs:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {workflow?.config?.inputs?.map(input => (
                                <Chip
                                  key={input.name}
                                  label={input.name}
                                  onClick={() => {
                                    // Insert the input variable at cursor position
                                    const inputVariable = `{${input.name}}`;
                                    const newDescription = insertTextAtCursor(
                                      inputVariable,
                                      task.description || '',
                                      cursorPosition.start,
                                      cursorPosition.end
                                    );
                                    handleTaskChange(task.id, 'description', newDescription);

                                    // Add to inputs array if not already present
                                    if (!task.inputs.includes(input.name)) {
                                      handleTaskChange(task.id, 'inputs', [...task.inputs, input.name]);
                                    }
                                  }}
                                  color={task.inputs.includes(input.name) ? "primary" : "default"}
                                  variant={task.inputs.includes(input.name) ? "filled" : "outlined"}
                                  sx={{ cursor: 'pointer' }}
                                />
                              ))}
                            </Box>

                            {/* Preview section */}
                            {task.description && task.inputs.length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="textSecondary">
                                  Variables used:
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  {task.inputs.map(input => (
                                    <Chip
                                      key={input}
                                      label={input}
                                      size="small"
                                      sx={{ mr: 0.5 }}
                                      onDelete={() => {
                                        // Remove from inputs array
                                        handleTaskChange(
                                          task.id,
                                          'inputs',
                                          task.inputs.filter(i => i !== input)
                                        );
                                        // Remove from description
                                        const newDescription = task.description.replace(
                                          new RegExp(`{${input}}`, 'g'),
                                          ''
                                        );
                                        handleTaskChange(task.id, 'description', newDescription);
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </CardContent>
                        </GlassmorphicCard>
                      </Grid>
                    ))}
                </GlassmorphicContainer>
              </GlassmorphicBox>
            </GlassmorphicPaper>
          )}
        </Grid>
      </Grid>

      {/* Footer Actions */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/agentic/workflow`)}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => setSaveDialogOpen(true)}
        >
          Save Configuration
        </Button>
      </Box>

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Configuration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to save these changes?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <DeleteConfirmationDialog />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkflowConfigPage;

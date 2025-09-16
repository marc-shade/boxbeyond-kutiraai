import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import WorkflowModal from './WorkflowModal';
import WorkflowCard from './WorkflowCard';
import { GlassmorphicContainer } from 'themes/GlassmorphicComponents';
import agenticWorkflowService from 'services/real-agentic-workflow-service';


const AgenticWorkflowPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [workflows, setWorkflows] = useState([]);

  const [editingWorkflow, setEditingWorkflow] = useState(null);

  const handleOpenModal = (workflow = null) => {
    setEditingWorkflow(workflow);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkflow(null);
  };

  const handleSubmit = async (formData) => {
    try {
      let result;

      if (formData.id) {
        // Update existing workflow using real service
        result = await agenticWorkflowService.updateWorkflow(formData.id, formData);
        if (result.success) {
          setWorkflows(workflows.map(workflow =>
            workflow.id === formData.id ? result.workflow : workflow
          ));
        }
      } else {
        // Create new workflow using real service
        result = await agenticWorkflowService.createWorkflow(formData);
        if (result.success) {
          setWorkflows([...workflows, result.workflow]);
        }
      }

      if (!result.success) {
        console.error('Failed to save workflow:', result.error);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    // Fetch workflows using real service
    const fetchWorkflows = async () => {
      try {
        const result = await agenticWorkflowService.listWorkflows();
        if (mounted && result.success) {
          setWorkflows(result.workflows || []);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching workflows:', error);
        }
      }
    };

    fetchWorkflows();
    return () => {
      mounted = false;
    };
  }, []);



  return (
    <GlassmorphicContainer variant="box"  sx={{ minHeight: '100vh' }}>
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5} mt={5}>
          <Typography variant="h4">Workflows</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
          >
            New Workflow
          </Button>
        </Stack>

   
          <Box sx={{ p: 2 }}>
            <Grid container spacing={3}>
              {workflows.map((workflow) => (
                <Grid key={workflow.id} item xs={12} sm={6} md={4}>
                  <WorkflowCard workflow={workflow}  onEdit={handleOpenModal}/>
                </Grid>
              ))}
            </Grid>
          </Box>
      </Container>
      <WorkflowModal
        open={isModalOpen}
        handleClose={handleCloseModal}
        handleSubmit={handleSubmit}
        initialData={editingWorkflow}
      />
    </GlassmorphicContainer>
  );
};

export default AgenticWorkflowPage;

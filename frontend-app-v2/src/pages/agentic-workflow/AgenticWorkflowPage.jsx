import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { Add as AddIcon, } from '@mui/icons-material';
import MainCard from 'components/MainCard';
import { useNavigate } from 'react-router-dom';
import WorkflowModal from './WorkflowModal';
import WorkflowCard from './WorkflowCard';

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
    // Process form data, e.g., send to API
    // Fix the tags splitting by ensuring it's a string first
    const tags = typeof formData.config.tags === 'string'
      ? formData.config.tags.split(',')
      : Array.isArray(formData.tags)
        ? formData.config.tags
        : [];
    const methodType = formData.id ? 'PUT' : 'POST';
    const uri = formData.id ? "/" + formData.id : '';
    // Replace this with your actual API call
    const response = await fetch('http://localhost:8100/workflows' + uri, {
      method: methodType,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const updatedWorkflow = await response.json();
    if (methodType === 'PUT') {
      // Update existing workflow
      setWorkflows(workflows.map(workflow => 
        workflow.id === formData.id ? updatedWorkflow : workflow
      ));
    } else {
      // Add new workflow
      setWorkflows([...workflows, updatedWorkflow]);
    }
    handleCloseModal();
  };

  useEffect(() => {
    let mounted = true;
    // Fetch workflows from your API
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('http://localhost:8100/workflows');
        const data = await response.json();
        if (mounted) {
          setWorkflows(data);
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
    <Box>
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Workflows</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
          >
            New Workflow
          </Button>
        </Stack>

        <MainCard content={false}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={3}>
              {workflows.map((workflow) => (
                <Grid key={workflow.id} item xs={12} sm={6} md={4}>
                  <WorkflowCard workflow={workflow}  onEdit={handleOpenModal} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </MainCard>
      </Container>
      <WorkflowModal
        open={isModalOpen}
        handleClose={handleCloseModal}
        handleSubmit={handleSubmit}
        initialData={editingWorkflow}
      />
    </Box>
  );
};

export default AgenticWorkflowPage;

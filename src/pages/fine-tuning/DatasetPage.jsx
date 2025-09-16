// DatasetPage.jsx
import React, { useState, useEffect } from 'react';
import { Grid, Button, Box, Stack, Typography, Container } from '@mui/material';
import DatasetCard from './DatasetCard';
import NewDatasetForm from './NewDataseForm';
import EditDatasetForm from './EditDatasetForm';
import { useNavigate } from 'react-router-dom';
import { GlassmorphicContainer } from 'themes/GlassmorphicComponents';
import { datasetService } from './services/datasetServices';

const DatasetPage = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [isNewDatasetFormOpen, setIsNewDatasetFormOpen] = useState(false);
  const [isEditDatasetFormOpen, setIsEditDatasetFormOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch initial datasets
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    // Replace this with your actual API call
    const response = await fetch('http://localhost:8200/api/v1/dataset_masters');
    const data = await response.json();
    setDatasets(data);
  };

  const handleCreateDataset = async (newDataset) => {
    // Replace this with your actual API call
    const response = await fetch('http://localhost:8200/api/v1/dataset_masters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDataset),
    });
    const createdDataset = await response.json();
    setDatasets([...datasets, { ...createdDataset, status: 'pending' }]);
  };

  const handleOnView = (datasetId) => {
    navigate(`/fine-tuning/datasets/${datasetId}`);
  };

  const handleEditDataset = (dataset) => {
    setSelectedDataset(dataset);
    setIsEditDatasetFormOpen(true);
  };

  const handleUpdateDataset = async (updatedDataset) => {
    try {
      setLoading(true);
      const updated = await datasetService.updateDataset(selectedDataset.id, updatedDataset);

      // Update the dataset in the local state
      setDatasets(datasets.map(d =>
        d.id === selectedDataset.id ? { ...d, ...updated } : d
      ));

      setIsEditDatasetFormOpen(false);
      setSelectedDataset(null);
    } catch (error) {
      console.error('Update failed:', error);
      throw error; // Re-throw to let the form handle the error
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDataset = async (datasetId) => {
    // Find the dataset
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    // Update local state to show 'in-progress'
    setDatasets(datasets.map(d =>
      d.id === datasetId ? { ...d, dataset_status: 'In-Progress' } : d
    ));

    // Replace this with your actual API call
    try {
      // Use the dataset_workflow_url for the POST request
      const response = await fetch(dataset.dataset_workflow_url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            {
              dataset_id: datasetId,
              systemPrompt: dataset.dataset_system_prompt,
              modelTemplate: dataset.dataset_model_template,
              domian: dataset.dataset_domain,
              filepath: dataset.dataset_filepath
            }
          )
        });
      if (!response.ok) throw new Error('Webhook invocation failed');

      // Update local state to 'Active' if the webhook call was successful
      setDatasets(datasets.map(d =>
        d.id === datasetId ? { ...d, dataset_status: 'Active' } : d
      ));
    } catch (error) {
      console.error('Launch failed:', error);
      // Update local state to show 'Failed'
      setDatasets(datasets.map(d =>
        d.id === datasetId ? { ...d, dataset_status: 'Failed' } : d
      ));
    }
  };

  return (
    <Box>
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5} mt={5}>
          <Typography variant="h4">Dataset</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsNewDatasetFormOpen(true)}
          >
            New Dataset
          </Button>
        </Stack>
        <Grid container spacing={3}>
          {datasets.map((dataset) => (
            <Grid item xs={12} sm={6} md={4} key={dataset.id}>
              <DatasetCard
                dataset={dataset}
                onLaunch={() => handleLaunchDataset(dataset.id)}
                onView={() => handleOnView(dataset.id)}
                onEdit={handleEditDataset}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
      <NewDatasetForm
        open={isNewDatasetFormOpen}
        onClose={() => setIsNewDatasetFormOpen(false)}
        onSubmit={handleCreateDataset}
      />

      <EditDatasetForm
        open={isEditDatasetFormOpen}
        onClose={() => {
          setIsEditDatasetFormOpen(false);
          setSelectedDataset(null);
        }}
        onSubmit={handleUpdateDataset}
        dataset={selectedDataset}
        loading={loading}
      />
    </Box>
  );
};

export default DatasetPage;
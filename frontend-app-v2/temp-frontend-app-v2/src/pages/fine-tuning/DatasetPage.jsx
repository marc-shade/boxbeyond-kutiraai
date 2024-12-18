// DatasetPage.jsx
import React, { useState, useEffect } from 'react';
import { Grid, Button, Box } from '@mui/material';
import DatasetCard from './DatasetCard';
import NewDatasetForm from './NewDataseForm';
import { useNavigate } from 'react-router-dom';

const DatasetPage = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [isNewDatasetFormOpen, setIsNewDatasetFormOpen] = useState(false);

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
        { method: 'POST',
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
      <Box mb={2}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setIsNewDatasetFormOpen(true)}
        >
          Create New Dataset
        </Button>
      </Box>
      <Grid container spacing={3}>
        {datasets.map((dataset) => (
          <Grid item xs={12} sm={6} md={4} key={dataset.id}>
            <DatasetCard 
              dataset={dataset} 
              onLaunch={() => handleLaunchDataset(dataset.id)}
              onView={() => handleOnView(dataset.id)}
            />
          </Grid>
        ))}
      </Grid>
      <NewDatasetForm
        open={isNewDatasetFormOpen}
        onClose={() => setIsNewDatasetFormOpen(false)}
        onSubmit={handleCreateDataset}
      />
    </Box>
  );
};

export default DatasetPage;
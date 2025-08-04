export const datasetService = {
    getDatasetById: async (id) => {
      try {
        const response = await fetch(`http://localhost:8200/api/v1/dataset_masters/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dataset details');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching dataset:', error);
        throw error;
      }
    },

    updateDataset: async (id, datasetData) => {
      try {
        const response = await fetch(`http://localhost:8200/api/v1/dataset_masters/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datasetData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to update dataset');
        }

        return await response.json();
      } catch (error) {
        console.error('Error updating dataset:', error);
        throw error;
      }
    },

    getAllDatasets: async () => {
      try {
        const response = await fetch('http://localhost:8200/api/v1/dataset_masters');
        if (!response.ok) {
          throw new Error('Failed to fetch datasets');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching datasets:', error);
        throw error;
      }
    },

    createDataset: async (datasetData) => {
      try {
        const response = await fetch('http://localhost:8200/api/v1/dataset_masters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datasetData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to create dataset');
        }

        return await response.json();
      } catch (error) {
        console.error('Error creating dataset:', error);
        throw error;
      }
    },

    // ... other dataset-related methods
  };
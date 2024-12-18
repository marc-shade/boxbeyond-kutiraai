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
    
    // ... other dataset-related methods
  };
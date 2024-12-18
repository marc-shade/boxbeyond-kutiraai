// src/services/finetuneService.js
const API_BASE_URL = 'http://localhost:8200/api/v1';
const API_FINETUNE_BASE_URL = 'http://localhost:8400';

export const finetuneService = {
  createFinetune: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/finetune/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create configuration');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getFinetunes: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/finetune/`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch configurations');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getFinetuneById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/finetune/${id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch configuration');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  updateFinetune: async (id, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/finetune/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update configuration');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deleteFinetune: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/finetune/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete configuration');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  launchTraining: async (id) => {
    const response = await fetch(`${API_FINETUNE_BASE_URL}/finetune/launch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config_id: id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to launch training');
    }

    return await response.json();
  },

  async getTaskStatus(taskId) {
    try {
      const response = await fetch(`${API_FINETUNE_BASE_URL}/finetune/task/${taskId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch finetune task status');
      }
  
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

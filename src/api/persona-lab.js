// API service for Persona Lab integration
const API_BASE_URL = 'http://localhost:9201';

export const personaLabAPI = {
  // Persona Management
  getPersonas: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/personas`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching personas:', error);
      throw error;
    }
  },

  getPersona: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/personas/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching persona:', error);
      throw error;
    }
  },

  createPersona: async (personaData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/personas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating persona:', error);
      throw error;
    }
  },

  updatePersona: async (id, personaData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/personas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating persona:', error);
      throw error;
    }
  },

  // Experiment Management
  getExperiments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching experiments:', error);
      throw error;
    }
  },

  getExperiment: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching experiment:', error);
      throw error;
    }
  },

  createExperiment: async (experimentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating experiment:', error);
      throw error;
    }
  },

  runExperiment: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error running experiment:', error);
      throw error;
    }
  },

  getExperimentResults: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${id}/results`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      throw error;
    }
  },

  // Focus Group Management
  getFocusGroups: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus-groups`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching focus groups:', error);
      throw error;
    }
  },

  updateExperiment: async (id, experimentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating experiment:', error);
      throw error;
    }
  },

  createFocusGroup: async (focusGroupData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(focusGroupData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating focus group:', error);
      throw error;
    }
  },

  updateFocusGroup: async (id, focusGroupData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus-groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(focusGroupData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating focus group:', error);
      throw error;
    }
  }
};

export default personaLabAPI;
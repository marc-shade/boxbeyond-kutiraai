/**
 * Real Persona Lab API
 * Connects to actual AI Persona Lab MCP server instead of mock
 */

const REAL_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Helper for API calls with error handling
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${REAL_API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

export const personaLabAPI = {
  // Personas CRUD using real MCP server
  getPersonas: async () => {
    try {
      // Try to get real personas from MCP
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'list_personas',
          params: {}
        })
      });

      if (result.success && result.result) {
        return {
          success: true,
          data: result.result.personas || []
        };
      }

      // Fallback to empty if service unavailable
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error fetching personas:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  getPersona: async (id) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'get_persona',
          params: { persona_id: id }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error fetching persona:', error);
      return { success: false, error: error.message };
    }
  },

  createPersona: async (personaData) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'create_persona',
          params: personaData
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error creating persona:', error);
      return { success: false, error: error.message };
    }
  },

  updatePersona: async (id, updates) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'update_persona',
          params: {
            persona_id: id,
            updates: updates
          }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error updating persona:', error);
      return { success: false, error: error.message };
    }
  },

  deletePersona: async (id) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'delete_persona',
          params: { persona_id: id }
        })
      });

      return { success: result.success };
    } catch (error) {
      console.error('Error deleting persona:', error);
      return { success: false, error: error.message };
    }
  },

  // Experiments using real MCP
  getExperiments: async () => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'list_experiments',
          params: {}
        })
      });

      if (result.success && result.result) {
        return {
          success: true,
          data: result.result.experiments || []
        };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error('Error fetching experiments:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  createExperiment: async (experimentData) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'create_experiment',
          params: experimentData
        })
      });

      return {
        success: result.success,
        data: result.result,
        id: result.result?.experiment_id
      };
    } catch (error) {
      console.error('Error creating experiment:', error);
      return { success: false, error: error.message };
    }
  },

  runExperiment: async (id) => {
    try {
      // Use the real orchestrated experiment endpoint
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'run_orchestrated_experiment',
          params: {
            experiment_id: id,
            use_all_personas: false
          }
        })
      });

      return {
        success: result.success,
        data: result.result,
        estimated_duration: '2-5 minutes'
      };
    } catch (error) {
      console.error('Error running experiment:', error);
      return { success: false, error: error.message };
    }
  },

  getExperimentResults: async (id) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'get_experiment_results',
          params: {
            experiment_id: id,
            include_analysis: true
          }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      return { success: false, error: error.message };
    }
  },

  getExperimentStatus: async (id) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'get_experiment_status',
          params: { experiment_id: id }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error fetching experiment status:', error);
      return { success: false, error: error.message };
    }
  },

  updateExperiment: async (id, updates) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'update_experiment',
          params: {
            experiment_id: id,
            updates: updates
          }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error updating experiment:', error);
      return { success: false, error: error.message };
    }
  },

  // Focus Groups using real MCP
  createFocusGroup: async (focusGroupData) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'run_focus_group_simulation',
          params: {
            persona_ids: focusGroupData.persona_ids,
            topic: focusGroupData.topic,
            rounds: focusGroupData.rounds || 3,
            moderator_enabled: focusGroupData.moderator_enabled !== false
          }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error creating focus group:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate marketing brief using real AI personas
  generateMarketingBrief: async (persona_ids, product, campaign_goals) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'generate_marketing_brief',
          params: {
            persona_ids,
            product,
            campaign_goals
          }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error generating marketing brief:', error);
      return { success: false, error: error.message };
    }
  },

  // Customer journey mapping with real personas
  generatePersonaJourney: async (persona_id, product) => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'generate_persona_journey',
          params: {
            persona_id,
            product
          }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error generating persona journey:', error);
      return { success: false, error: error.message };
    }
  },

  // Batch spawn personas for testing
  batchSpawnPersonas: async (persona_ids, scenario_type = 'survey_response') => {
    try {
      const result = await apiCall('/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({
          service: 'ai-persona-lab',
          tool: 'batch_spawn_personas',
          params: {
            persona_ids,
            scenario_type
          }
        })
      });

      return {
        success: result.success,
        data: result.result
      };
    } catch (error) {
      console.error('Error batch spawning personas:', error);
      return { success: false, error: error.message };
    }
  }
};

export default personaLabAPI;
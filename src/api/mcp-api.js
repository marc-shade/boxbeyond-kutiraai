// Simple API client for MCP services
const API_BASE_URL = 'http://localhost:8000/api';

export const getMCPServices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mcp/services`);
    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching MCP services:', error);
    throw error;
  }
};

export const getMCPMetrics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mcp/metrics`);
    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching MCP metrics:', error);
    throw error;
  }
};

export const getMCPHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mcp/health`);
    if (!response.ok) {
      throw new Error('Failed to fetch health');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching MCP health:', error);
    throw error;
  }
};

export const executeMCPTool = async (service, tool, params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service, tool, params }),
    });
    if (!response.ok) {
      throw new Error('Failed to execute tool');
    }
    return await response.json();
  } catch (error) {
    console.error('Error executing MCP tool:', error);
    throw error;
  }
};
// API service for dashboard data
const API_BASE_URL = 'http://localhost:8000/api';

export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get chart data for dashboard
  getChartData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/chart-data`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard chart data:', error);
      throw error;
    }
  }
};

export default dashboardAPI;

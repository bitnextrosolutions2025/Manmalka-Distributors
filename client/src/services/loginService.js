import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

export const loginService = {
  // Get all login records
  getAllLoginRecords: async () => {
    try {
      const response = await apiClient.get('/auth/login-records');
      return response.data;
    } catch (error) {
      console.error('Error fetching login records:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch login records' };
    }
  },

  // Get login records for specific user
  getUserLoginRecords: async (userId) => {
    try {
      const response = await apiClient.get(`/auth/login-records/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user login records:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch user login records' };
    }
  },

  // Get login statistics
  getLoginStats: async () => {
    try {
      const response = await apiClient.get('/auth/login-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching login stats:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch login statistics' };
    }
  },

  // Format session duration
  formatDuration: (milliseconds) => {
    if (!milliseconds) return 'N/A';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  // Format date and time
  formatDateTime: (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }
};

export default loginService;

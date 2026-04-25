import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Location API service for handling location-related HTTP requests
 */
export const locationAPI = {
    /**
     * Update user location
     * @param {number} latitude
     * @param {number} longitude
     * @param {number} accuracy
     */
    updateLocation: async (latitude, longitude, accuracy) => {
        try {
            const response = await axios.post(`${API_BASE}/location/update`, {
                latitude,
                longitude,
                accuracy
            }, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Location update error:', error);
            throw error;
        }
    },

    /**
     * Get all active users' locations (Admin only)
     */
    getAllUsersLocations: async () => {
        console.log(API_BASE)
        try {
            const response = await axios.get(`${API_BASE}/location/all-users`);
            return response.data;
        } catch (error) {
            console.error('Fetch all locations error:', error);
            throw error;
        }
    },

    /**
     * Get specific user's location (Admin only)
     * @param {string} userId
     */
    getUserLocation: async (userId) => {
        try {
            const response = await axios.get(`${API_BASE}/location/user/${userId}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Fetch user location error:', error);
            throw error;
        }
    },

    /**
     * Mark user as offline (logout)
     */
    logout: async () => {
        try {
            const response = await axios.post(`${API_BASE}/location/logout`, {}, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    /**
     * Get current user's location
     */
    getMyLocation: async () => {
        try {
            const response = await axios.get(`${API_BASE}/location/my-location`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Get my location error:', error);
            throw error;
        }
    }
};

export default locationAPI;

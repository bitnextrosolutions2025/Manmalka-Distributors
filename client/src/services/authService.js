import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 🔑 CRITICAL: Enable credentials to send cookies automatically
});

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired (401), redirect to login only if NOT a login request
    if (error.response?.status === 401) { 
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isRegisterRequest = error.config?.url?.includes('/auth/register');
      
      // Only redirect if it's NOT a login/register request (e.g., protected route accessed with expired token)
      if (!isLoginRequest && !isRegisterRequest) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth service methods
export const authService = {
  // Login user (cookies are set by backend automatically)
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password
      });
      
      if (response.data.success) {
        // Backend sets HttpOnly cookie automatically
        // Store minimal user data in localStorage (non-sensitive)
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      // Throw proper error with message property
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message || error.message || 'Login failed. Please try again.';
      const err = new Error(errorMessage);
      err.data = errorData;
      throw err;
    }
  },

  // Register user
  register: async (username, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', {
        username,
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Logout user (clear stored data, backend clears cookie)
  logout: async (userid) => {
  try {
   
    await apiClient.post('/auth/logout', { 
      userId: userid
    }); // clears cookie on server
  } catch (err) {
    console.error("Logout failed", err);
  }
},

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is logged in (checks localStorage, cookie handled by browser)
   checkAuth: async () => {
    try {
      const res = await apiClient.get('/auth/getuser'); // backend verifies cookie

    return res.data.user;
      
      // user data
    } catch (err) {
      return null;
    }
  }
};

export default apiClient;


/**
 * EXAMPLE INTEGRATION FILE
 * 
 * This file shows how to integrate all the location tracking components
 * into your existing React app. Copy relevant parts to your actual files.
 * 
 * Files this affects:
 * - client/src/App.jsx (or your main router)
 * - client/src/contexts/UserdataContext.jsx (or your auth context)
 * - client/src/pages/Login.jsx
 * - client/src/pages/Register.jsx (logout handler)
 * - client/src/components/AdminProtectedRoute.jsx
 */

// ============================================================================
// 1. UPDATE APP.JSX
// ============================================================================

/**
 * CLIENT SIDE - App.jsx
 * 
 * This shows how to integrate LocationTracker and AdminDashboard
 */

import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LocationTracker from './components/LocationTracker';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';

// Your existing imports
import Login from './pages/Login';
import Register from './pages/Register';
import UserAllOrder from './pages/UserAllOrder';
import AllOrderShow from './pages/AllOrderShow';
import Order from './pages/Order';

import UserDataContext from './contexts/UserdataContext';

function App() {
  // Get auth state from your context
  const { user, isLoggedIn } = useContext(UserDataContext);

  return (
    <BrowserRouter>
      {/* LocationTracker component must be at root level */}
      {/* It will show permission prompt when user logs in */}
      <LocationTracker 
        isLoggedIn={isLoggedIn} 
        userId={user?.userId}
        onPermissionDenied={() => {
          // Optional: Show a notification that location tracking is disabled
          console.warn('User denied location permission');
        }}
      />

      <Navbar />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected User Routes */}
        <Route path="/orders" element={<UserAllOrder />} />
        <Route path="/order" element={<Order />} />

        {/* Admin Routes - Protected with AdminProtectedRoute */}
        <Route
          path="/admin/dashboard"
          element={<AdminProtectedRoute element={<AdminDashboard />} />}
        />
        <Route
          path="/admin/orders"
          element={<AdminProtectedRoute element={<AllOrderShow />} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


// ============================================================================
// 2. UPDATE LOGIN COMPONENT
// ============================================================================

/**
 * CLIENT SIDE - pages/Login.jsx
 * 
 * Make sure login response stores user data in context and localStorage
 */

import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDataContext from '../contexts/UserdataContext';
import authService from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const { setUser, setIsLoggedIn } = useContext(UserDataContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call your auth service login
      const response = await authService.login(formData.username, formData.password);

      if (response.success) {
        // Extract user data
        const userData = response.user; // or response.data.user depending on your API

        // Store in context - LocationTracker will detect this and show permission
        setUser({
          userId: userData.id || userData._id,
          username: userData.username,
          email: userData.email,
          role: userData.role // Important: include role for admin check
        });
        setIsLoggedIn(true);

        // Also store in localStorage for socketService to access
        localStorage.setItem('user', JSON.stringify({
          userId: userData.id || userData._id,
          username: userData.username,
          email: userData.email,
          role: userData.role
        }));

        // Navigate to dashboard
        navigate('/orders');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username or Email</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Don't have an account? <a href="/register" className="text-blue-600">Register here</a>
      </p>
    </div>
  );
};

export default Login;


// ============================================================================
// 3. UPDATE LOGOUT HANDLER
// ============================================================================

/**
 * CLIENT SIDE - Usually in Navbar.jsx or useAuth hook
 * 
 * Example logout function that properly cleans up location tracking
 */

import locationAPI from '../services/locationService';
import socketService from '../services/socketService';
import authService from '../services/authService';

const handleLogout = async () => {
  try {
    // Step 1: Call your auth API logout
    await authService.logout();

    // Step 2: Mark location as offline in database
    try {
      await locationAPI.logout();
    } catch (err) {
      console.error('Location logout error (non-critical):', err);
      // Continue even if this fails
    }

    // Step 3: Notify socket server and disconnect
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.userId) {
        socketService.logout(user.userId);
        socketService.disconnect();
      }
    } catch (err) {
      console.error('Socket logout error (non-critical):', err);
      // Continue even if this fails
    }

    // Step 4: Clear user context
    setUser(null);
    setIsLoggedIn(false);

    // Step 5: Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('authToken'); // if you use this

    // Step 6: Navigate to login
    navigate('/login');
  } catch (error) {
    console.error('Logout error:', error);
    // Show error to user but still clear data
    alert('Error during logout: ' + error.message);
    
    // Force clear data even on error
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    navigate('/login');
  }
};


// ============================================================================
// 4. UPDATE ADMIN PROTECTED ROUTE
// ============================================================================

/**
 * CLIENT SIDE - components/AdminProtectedRoute.jsx
 * 
 * This should check both authentication and admin role
 */

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import UserDataContext from '../contexts/UserdataContext';

const AdminProtectedRoute = ({ element }) => {
  const { user, isLoggedIn } = useContext(UserDataContext);

  // Check if user is logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  // Adjust this based on how you store admin flag in User model
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and is admin
  return element;
};

export default AdminProtectedRoute;


// ============================================================================
// 5. CONTEXT STRUCTURE (REFERENCE)
// ============================================================================

/**
 * CLIENT SIDE - contexts/UserdataContext.jsx
 * 
 * Make sure your context looks something like this:
 */

import React, { createContext, useState } from 'react';

const UserDataContext = createContext();

export const UserDataProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const value = {
    user,
    setUser,
    isLoggedIn,
    setIsLoggedIn
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export default UserDataContext;


// ============================================================================
// 6. NAVBAR LOGOUT EXAMPLE
// ============================================================================

/**
 * CLIENT SIDE - components/Navbar.jsx
 * 
 * Example navbar with logout button
 */

import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDataContext from '../contexts/UserdataContext';
import locationAPI from '../services/locationService';
import socketService from '../services/socketService';
import authService from '../services/authService';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, setUser, setIsLoggedIn } = useContext(UserDataContext);

  const handleLogout = async () => {
    try {
      // Call auth logout
      await authService.logout();

      // Mark location as offline
      try {
        await locationAPI.logout();
      } catch (err) {
        console.error('Location logout error:', err);
      }

      // Disconnect socket
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData?.userId) {
          socketService.logout(userData.userId);
        }
        socketService.disconnect();
      } catch (err) {
        console.error('Socket disconnect error:', err);
      }

      // Clear state and storage
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('user');

      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error during logout');
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Manmalka Distributors</h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-700">Welcome, {user?.username}</span>
                
                {/* Admin links */}
                {user?.role === 'admin' && (
                  <>
                    <a href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
                      Dashboard
                    </a>
                    <a href="/admin/orders" className="text-blue-600 hover:text-blue-800">
                      All Orders
                    </a>
                  </>
                )}

                {/* User links */}
                <a href="/orders" className="text-blue-600 hover:text-blue-800">
                  My Orders
                </a>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="text-blue-600 hover:text-blue-800">
                  Login
                </a>
                <a href="/register" className="text-blue-600 hover:text-blue-800">
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


// ============================================================================
// 7. USER MODEL - DATABASE SCHEMA UPDATE
// ============================================================================

/**
 * SERVER SIDE - models/User.js
 * 
 * Consider adding a role field to your User model for admin functionality
 */

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);
export default User;


// ============================================================================
// IMPORTANT NOTES
// ============================================================================

/*
 * 1. USER CONTEXT MUST INCLUDE userId
 *    - LocationTracker reads from context to know when user logs in
 *    - socketService uses localStorage.user.userId
 *
 * 2. MAKE SURE TO UPDATE BOTH:
 *    - setUser() in context
 *    - localStorage.setItem('user', ...) in Login page
 *
 * 3. ADMIN ROLE CHECKING
 *    - Add 'role' field to User model
 *    - Include role in login response
 *    - Set role in context on login
 *    - Check role in AdminProtectedRoute
 *
 * 4. ENVIRONMENT VARIABLES
 *    - Server: FRONTEND_URL=http://localhost:5173
 *    - Client: VITE_API_URL=http://localhost:5000
 *
 * 5. SOCKET.IO CONNECTION
 *    - Happens automatically when LocationTracker mounts
 *    - disconnection happens on logout or app close
 *
 * 6. LOCATION UPDATES
 *    - Started automatically after user allows permission
 *    - Sent every 5 minutes (throttled)
 *    - Stopped on logout
 */

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { useUserData } from '../contexts/UserdataContext.jsx';
/**
 * ProtectedRoute Component
 * Protects routes that require authentication
 * Redirects to login if user is not authenticated
 * 
 * Usage:
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children }) {
//   const [user, setUser] = useState(undefined);
  const {useralldata,setUseralldata}=useUserData();
  useEffect(() => {
    authService.checkAuth().then(setUseralldata);
  }, []);

  if (useralldata === undefined) return <div>Loading...</div>;

  return useralldata ? children : <Navigate to="/login" replace />;
}


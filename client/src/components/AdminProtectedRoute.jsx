import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminProtectedRoute Component
 * Protects admin routes that require authentication
 * Redirects to admin login if admin token is not found in localStorage
 * 
 * Usage:
 * <AdminProtectedRoute>
 *   <AdminDashboard />
 * </AdminProtectedRoute>
 */
export default function AdminProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Check if admin token exists in localStorage
    const adminToken = localStorage.getItem('adminauth');
    setIsAuthenticated(!!adminToken);
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  // If authenticated, render children; otherwise redirect to admin login
  return isAuthenticated ? children : <Navigate to="/admin-login" replace />;
}

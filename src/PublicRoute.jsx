import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * PublicRoute - Redirects authenticated users away from public pages like login/signup
 * Use this for pages that should only be accessible to unauthenticated users
 */
export default function PublicRoute({ children, redirectTo = '/dashboard' }) {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If user is authenticated, redirect them away from public pages
  if (session) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // If user is not authenticated, show the public page
  return children;
}

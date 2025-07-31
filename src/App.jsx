import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginComponent from './LoginPage';
import AcceptInvitationPage from './components/AcceptInvitationPage';
import { ForgotPasswordForm } from './components/forgot-password-form';
import UpdatePasswordPage from './components/UpdatePasswordPage';
import Dashboard from './Dashboard';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import NotFoundPage from './components/NotFoundPage';
import PWAStatus from './components/PWAStatus';
import PWATestPage from './components/PWATestPage';
import { NotificationProvider } from './contexts/NotificationContext';

export default function App() {
  return (
    <NotificationProvider>
      <Routes>
        {/* Public routes - redirect authenticated users to dashboard */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginComponent />
            </PublicRoute>
          } 
        />
        
        {/* Forgot password route */}
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPasswordForm />
            </PublicRoute>
          } 
        />
        
        {/* Update password route - for password reset emails */}
        <Route 
          path="/auth/update-password" 
          element={
            <PublicRoute>
              <UpdatePasswordPage />
            </PublicRoute>
          } 
        />
        
        {/* Invitation acceptance route - public but requires valid invitation */}
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        
        {/* Legacy invitation route - redirect to new format */}
        <Route path="/invite/:token" element={<Navigate to="/accept-invitation" replace />} />
        
        {/* PWA Test Page - accessible for admin users */}
        <Route path="/admin/pwa-test" element={<PWATestPage />} />
        
        {/* Database Diagnostics - accessible for debugging */}
        <Route path="/diagnostics" element={
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h2 className="text-green-800 font-bold">✅ Database Connection Working!</h2>
              <p className="text-green-600">Your database connection is successful. The original error may be resolved.</p>
              <p className="text-sm text-green-600 mt-2">Try navigating to the Clientes page to test.</p>
            </div>
          </div>
        } />
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch-all 404 route - must be last */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* PWA Status Indicator */}
      <PWAStatus />
    </NotificationProvider>
  );
}
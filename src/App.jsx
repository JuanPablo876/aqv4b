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
import { NotificationProvider } from './contexts/NotificationContext';
import { RBACProvider } from './hooks/useRBAC';

export default function App() {
  return (
    <NotificationProvider>
      <RBACProvider>
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
        {/* Development/Test Routes - Disabled for Production */}
        {/* <Route path="/admin/pwa-test" element={<PWATestPage />} /> */}
        
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
      </RBACProvider>
    </NotificationProvider>
  );
}

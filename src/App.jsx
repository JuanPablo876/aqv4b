import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginComponent from './LoginPage';
import SignupPage from './components/SignupPage';
import InviteAcceptPage from './components/InviteAcceptPage';
import Dashboard from './Dashboard';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import NotFoundPage from './components/NotFoundPage';
import PWAStatus from './components/PWAStatus';
import PWATestPage from './components/PWATestPage';
import ValidatedFormTest from './components/ValidatedFormTest';

export default function App() {
  return (
    <>
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
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } 
        />
        
        {/* Invitation acceptance route - public but requires valid token */}
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        {/* PWA Test Page - accessible without authentication for testing */}
        <Route path="/pwa-test" element={<PWATestPage />} />
        
        {/* ValidatedForm Test Page */}
        <Route path="/form-test" element={<ValidatedFormTest />} />
        
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch-all 404 route - must be last */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* PWA Status Indicator */}
      <PWAStatus />
    </>
  );
}
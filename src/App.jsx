import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginComponent from './LoginPage';
import Dashboard from './Dashboard';
import PrivateRoute from './PrivateRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginComponent />} />
      <Route path="/signup" element={<div>Signup Page</div>} />
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
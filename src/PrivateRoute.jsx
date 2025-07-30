import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function PrivateRoute({ children }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}
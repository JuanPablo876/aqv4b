/**
 * ProtectedRoute - Component for role and permission-based route protection
 */

import React from 'react';
import { useRBAC } from '../hooks/useRBAC';

const ProtectedRoute = ({ 
  children, 
  requiredPermission = null,
  requiredRole = null,
  module = null,
  action = null,
  fallback = null
}) => {
  const { 
    initialized, 
    loading, 
    hasPermission, 
    hasRole,
    canAccessModule 
  } = useRBAC();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Verificando permisos...</span>
      </div>
    );
  }

  // If RBAC is not initialized, allow access (fallback behavior)
  if (!initialized) {
    return children;
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Acceso Denegado</h3>
          <p>No tienes el rol necesario para acceder a esta sección.</p>
          <p className="text-sm mt-2">Roles requeridos: {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}</p>
        </div>
      </div>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return fallback || (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Acceso Denegado</h3>
          <p>No tienes permisos para acceder a esta sección.</p>
          <p className="text-sm mt-2">Permiso requerido: {requiredPermission.module}.{requiredPermission.action}</p>
        </div>
      </div>
    );
  }

  // Check module and action based access
  if (module && action && !hasPermission(module, action)) {
    return fallback || (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Acceso Denegado</h3>
          <p>No tienes permisos para realizar esta acción.</p>
          <p className="text-sm mt-2">Permiso requerido: {module}.{action}</p>
        </div>
      </div>
    );
  }

  // Check module access only
  if (module && !action && !canAccessModule(module)) {
    return fallback || (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Acceso Denegado</h3>
          <p>No tienes acceso a este módulo.</p>
          <p className="text-sm mt-2">Módulo: {module}</p>
        </div>
      </div>
    );
  }

  // Allow access
  return children;
};

export default ProtectedRoute;

/**
 * useRBAC Hook - React hook for Role-Based Access Control
 * Provides easy access to user permissions and roles in React components
 */

import { useState, useEffect, useContext, createContext } from 'react';
import rbacService from '../services/rbacService';

// Create RBAC Context
const RBACContext = createContext();

// RBAC Provider Component
export const RBACProvider = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    initializeRBAC();
  }, []);

  const initializeRBAC = async () => {
    try {
      setLoading(true);
      const success = await rbacService.initialize();
      setInitialized(success);
      
      if (success) {
        setUserInfo(rbacService.getCurrentUserInfo());
      }
    } catch (error) {
      console.error('Error initializing RBAC:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserInfo = async () => {
    await rbacService.loadUserRoles();
    setUserInfo(rbacService.getCurrentUserInfo());
  };

  const value = {
    initialized,
    loading,
    userInfo,
    refreshUserInfo,
    hasPermission: rbacService.hasPermission.bind(rbacService),
    hasRole: rbacService.hasRole.bind(rbacService),
    isAdmin: rbacService.isAdmin.bind(rbacService),
    isManager: rbacService.isManager.bind(rbacService),
    canAccessModule: rbacService.canAccessModule.bind(rbacService),
    canPerformAction: rbacService.canPerformAction.bind(rbacService)
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

// Hook to use RBAC context
export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
};

// Hook for permission checking
export const usePermission = (moduleOrPermission, action = null) => {
  const { hasPermission, initialized } = useRBAC();
  
  if (!initialized) {
    return true; // Allow access if RBAC not initialized
  }
  
  return hasPermission(moduleOrPermission, action);
};

// Hook for role checking
export const useRole = (roles) => {
  const { hasRole, initialized } = useRBAC();
  
  if (!initialized) {
    return true; // Allow access if RBAC not initialized
  }
  
  return hasRole(roles);
};

// Hook for admin check
export const useIsAdmin = () => {
  const { isAdmin, initialized } = useRBAC();
  
  if (!initialized) {
    return true; // Allow access if RBAC not initialized
  }
  
  return isAdmin();
};

// Hook for manager check
export const useIsManager = () => {
  const { isManager, initialized } = useRBAC();
  
  if (!initialized) {
    return true; // Allow access if RBAC not initialized
  }
  
  return isManager();
};

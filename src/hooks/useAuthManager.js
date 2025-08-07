/**
 * Custom hook for using AuthManager in React components
 * Provides optimized authentication state management
 */

import { useState, useEffect, useCallback } from 'react';
import authManager from '../services/authManager';

export function useAuthManager() {
  const [user, setUser] = useState(authManager.getCurrentUser());
  const [session, setSession] = useState(authManager.getCurrentSession());
  const [loading, setLoading] = useState(!authManager.isAuthenticated());

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authManager.subscribe((newUser, newSession) => {
      setUser(newUser);
      setSession(newSession);
      setLoading(false);
    });

    // If not initialized, trigger initialization
    if (!authManager.isAuthenticated()) {
      authManager.initialize().then(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      await authManager.refresh();
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: authManager.isAuthenticated(),
    refreshAuth,
    getUserEmail: authManager.getUserEmail.bind(authManager),
    getUserId: authManager.getUserId.bind(authManager),
    getUserMetadata: authManager.getUserMetadata.bind(authManager),
    getAuthHeaders: authManager.getAuthHeaders.bind(authManager)
  };
}

/**
 * Hook for getting current user synchronously (when cached)
 * Use this when you need immediate access to user data and auth is already initialized
 */
export function useCurrentUser() {
  const [user, setUser] = useState(authManager.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authManager.subscribe((newUser) => {
      setUser(newUser);
    });

    return unsubscribe;
  }, []);

  return user;
}

/**
 * Hook for checking if user is authenticated (synchronous when cached)
 */
export function useIsAuthenticated() {
  const [isAuth, setIsAuth] = useState(authManager.isAuthenticated());

  useEffect(() => {
    const unsubscribe = authManager.subscribe((user) => {
      setIsAuth(!!user);
    });

    return unsubscribe;
  }, []);

  return isAuth;
}

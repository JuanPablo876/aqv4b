/**
 * Centralized Authentication Manager
 * Reduces redundant auth requests by caching user session and providing
 * a single source of truth for authentication state across the application
 */

import { supabase } from '../supabaseClient';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.subscribers = new Set();
    this.lastAuthCheck = null;
    this.retryTimeout = null;
    this.AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    
    // Initialize on construction
    this.initialize();
  }

  /**
   * Initialize authentication state
   * This method ensures we only fetch auth once and reuse the result
   */
  async initialize() {
    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized and cache is still valid, return immediately
    if (this.isInitialized && this.isCacheValid()) {
      return Promise.resolve(this.currentUser);
    }

    this.initializationPromise = this._performInitialization();
    
    try {
      await this.initializationPromise;
      return this.currentUser;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Internal initialization logic
   */
  async _performInitialization() {
    try {
      console.log('🔄 AuthManager: Initializing authentication state...');
      
      // Get current session first (faster than getUser for checking auth state)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ AuthManager: Session error:', sessionError);
        
        // Try to recover from session error
        if (sessionError.message?.includes('refresh_token')) {
          console.log('🔄 AuthManager: Attempting session recovery...');
          await this.handleSessionRecovery();
        }
        
        this.resetState();
        return null;
      }

      this.session = session;
      
      if (!session?.user) {
        console.log('📝 AuthManager: No active session found');
        this.resetState();
        return null;
      }

      // If we have a session, we already have the user
      this.currentUser = session.user;
      this.isInitialized = true;
      this.lastAuthCheck = Date.now();
      
      console.log('✅ AuthManager: Authentication initialized for:', this.currentUser.email);
      
      // Notify all subscribers of auth state change
      this.notifySubscribers();
      
      return this.currentUser;
    } catch (error) {
      console.error('❌ AuthManager: Initialization failed:', error);
      
      // Attempt recovery for common errors
      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch')) {
        console.log('🔄 AuthManager: Network error detected, will retry...');
        this.scheduleRetry();
      }
      
      this.resetState();
      return null;
    }
  }

  /**
   * Handle session recovery for token refresh issues
   */
  async handleSessionRecovery() {
    try {
      console.log('🔄 AuthManager: Attempting to refresh session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ AuthManager: Session refresh failed:', error);
        // Force sign out if refresh fails
        await supabase.auth.signOut();
        return false;
      }
      
      if (data.session) {
        console.log('✅ AuthManager: Session refreshed successfully');
        this.session = data.session;
        this.currentUser = data.session.user;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ AuthManager: Session recovery failed:', error);
      return false;
    }
  }

  /**
   * Schedule a retry for failed initialization
   */
  scheduleRetry() {
    // Don't schedule multiple retries
    if (this.retryTimeout) return;
    
    const retryDelay = 2000; // 2 seconds
    console.log(`⏰ AuthManager: Scheduling retry in ${retryDelay}ms...`);
    
    this.retryTimeout = setTimeout(async () => {
      this.retryTimeout = null;
      console.log('🔄 AuthManager: Retrying initialization...');
      await this.initialize();
    }, retryDelay);
  }

  /**
   * Get current user with caching
   * This is the main method services should use instead of supabase.auth.getUser()
   */
  async getCurrentUser() {
    // If we have a valid cached user, return it immediately
    if (this.currentUser && this.isCacheValid()) {
      return this.currentUser;
    }

    // Otherwise, initialize/refresh
    return await this.initialize();
  }

  /**
   * Get current session with caching
   */
  getCurrentSession() {
    return this.session;
  }

  /**
   * Check if user is authenticated (synchronous when cached)
   */
  isAuthenticated() {
    return !!(this.currentUser && this.isCacheValid());
  }

  /**
   * Check if auth cache is still valid
   */
  isCacheValid() {
    if (!this.lastAuthCheck) return false;
    return (Date.now() - this.lastAuthCheck) < this.AUTH_CACHE_DURATION;
  }

  /**
   * Force refresh authentication state
   * Use this when you suspect the auth state might have changed
   */
  async refresh() {
    console.log('🔄 AuthManager: Force refreshing auth state...');
    this.resetCache();
    return await this.initialize();
  }

  /**
   * Reset only the cache, not the entire state
   */
  resetCache() {
    this.lastAuthCheck = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Reset entire authentication state
   */
  resetState() {
    this.currentUser = null;
    this.session = null;
    this.isInitialized = false;
    this.lastAuthCheck = null;
    this.initializationPromise = null;
    
    // Clear any pending retries
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    this.notifySubscribers();
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Immediately call with current state
    callback(this.currentUser, this.session);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentUser, this.session);
      } catch (error) {
        console.error('Error in auth subscriber:', error);
      }
    });
  }

  /**
   * Get user metadata safely
   */
  getUserMetadata() {
    if (!this.currentUser) return {};
    return this.currentUser.user_metadata || {};
  }

  /**
   * Get user email safely
   */
  getUserEmail() {
    return this.currentUser?.email || null;
  }

  /**
   * Get user ID safely
   */
  getUserId() {
    return this.currentUser?.id || null;
  }

  /**
   * Setup auth state listener (call this once in App.js or AuthContext)
   */
  setupAuthListener() {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 AuthManager: Auth state changed:', event);
        
        this.session = session;
        this.currentUser = session?.user || null;
        this.lastAuthCheck = Date.now();
        this.isInitialized = true;
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          this.resetState();
        }
        
        this.notifySubscribers();
      }
    );

    return subscription;
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders() {
    if (!this.session?.access_token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${this.session.access_token}`,
      'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY
    };
  }
}

// Create singleton instance
const authManager = new AuthManager();

export default authManager;

// Named exports for convenience
export const {
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  refresh: refreshAuth,
  subscribe: subscribeToAuth,
  getAuthHeaders,
  getUserEmail,
  getUserId,
  getUserMetadata
} = authManager;

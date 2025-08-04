// Real-time data refresh utilities for dashboard improvements
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { handleError } from './errorHandling';

/**
 * Hook for real-time data fetching with caching and refresh capabilities
 * @param {Function} fetchFn - Function to fetch data
 * @param {Object} options - Configuration options
 * @returns {Object} - Data, loading state, error, and refresh function
 */
export const useRealTimeData = (fetchFn, options = {}) => {
  const {
    refreshInterval = 30000, // 30 seconds default
    retryCount = 3,
    retryDelay = 1000,
    enableRealTime = true,
    cacheKey = null
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const attemptRef = useRef(0);

  // Fetch data with retry logic
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setLastUpdated(new Date());
      attemptRef.current = 0;
      
      // Cache data if cache key provided
      if (cacheKey && typeof window !== 'undefined') {
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      
      if (attemptRef.current < retryCount) {
        attemptRef.current++;
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(silent);
        }, retryDelay * attemptRef.current);
      } else {
        setError(err.message || 'Error al cargar datos');
        handleError(err, 'real-time data fetch', 'Error al actualizar datos', false);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [fetchFn, retryCount, retryDelay, cacheKey]);

  // Load cached data on mount
  useEffect(() => {
    if (cacheKey && typeof window !== 'undefined') {
      const cached = localStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          // Use cached data if it's less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setData(cachedData);
            setLastUpdated(new Date(timestamp));
          }
        } catch (e) {
          console.warn('Failed to parse cached data:', e);
        }
      }
    }
  }, [cacheKey]);

  // Initial fetch and set up refresh interval
  useEffect(() => {
    fetchData();

    if (enableRealTime && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(true); // Silent refresh
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [fetchData, enableRealTime, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

/**
 * Hook for real-time Supabase subscriptions
 * @param {string} table - Table name to subscribe to
 * @param {Function} onUpdate - Callback when data changes
 * @param {Object} filter - Filter conditions
 * @returns {Function} - Cleanup function
 */
export const useSupabaseSubscription = (table, onUpdate, filter = {}) => {
  useEffect(() => {
    let subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table,
          ...filter
        }, 
        (payload) => {
          console.log(`Real-time update on ${table}:`, payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [table, onUpdate, filter]);
};

/**
 * Dashboard data refresh manager
 */
export class DashboardDataManager {
  constructor() {
    this.subscribers = new Map();
    this.refreshInterval = 30000; // 30 seconds
    this.isActive = true;
  }

  /**
   * Subscribe to data updates
   * @param {string} key - Unique key for the subscription
   * @param {Function} fetchFn - Function to fetch data
   * @param {Function} updateFn - Function to update component state
   * @param {Object} options - Configuration options
   */
  subscribe(key, fetchFn, updateFn, options = {}) {
    const subscription = {
      fetchFn,
      updateFn,
      options,
      lastFetch: 0,
      retryCount: 0
    };

    this.subscribers.set(key, subscription);
    
    // Immediate fetch
    this.fetchData(key);
    
    return () => this.unsubscribe(key);
  }

  /**
   * Unsubscribe from data updates
   * @param {string} key - Subscription key
   */
  unsubscribe(key) {
    this.subscribers.delete(key);
  }

  /**
   * Fetch data for a specific subscription
   * @param {string} key - Subscription key
   */
  async fetchData(key) {
    const subscription = this.subscribers.get(key);
    if (!subscription) return;

    const { fetchFn, updateFn, options } = subscription;
    
    try {
      const data = await fetchFn();
      updateFn(data);
      subscription.lastFetch = Date.now();
      subscription.retryCount = 0;
    } catch (error) {
      console.error(`Error fetching data for ${key}:`, error);
      
      if (subscription.retryCount < (options.maxRetries || 3)) {
        subscription.retryCount++;
        setTimeout(() => this.fetchData(key), 1000 * subscription.retryCount);
      } else {
        handleError(error, `dashboard data fetch (${key})`, `Error al actualizar ${key}`, false);
      }
    }
  }

  /**
   * Refresh all subscriptions
   */
  refreshAll() {
    this.subscribers.forEach((_, key) => {
      this.fetchData(key);
    });
  }

  /**
   * Start automatic refresh cycle
   */
  startAutoRefresh() {
    this.isActive = true;
    this.autoRefreshCycle();
  }

  /**
   * Stop automatic refresh
   */
  stopAutoRefresh() {
    this.isActive = false;
  }

  /**
   * Auto refresh cycle
   */
  async autoRefreshCycle() {
    if (!this.isActive) return;

    // Refresh subscriptions that need updating
    const now = Date.now();
    for (const [key, subscription] of this.subscribers) {
      const timeSinceLastFetch = now - subscription.lastFetch;
      const refreshInterval = subscription.options.refreshInterval || this.refreshInterval;
      
      if (timeSinceLastFetch >= refreshInterval) {
        await this.fetchData(key);
      }
    }

    // Schedule next cycle
    setTimeout(() => this.autoRefreshCycle(), 5000); // Check every 5 seconds
  }

  /**
   * Update refresh interval for all subscriptions
   * @param {number} interval - New interval in milliseconds
   */
  setRefreshInterval(interval) {
    this.refreshInterval = interval;
  }

  /**
   * Get statistics about subscriptions
   */
  getStats() {
    return {
      totalSubscriptions: this.subscribers.size,
      isActive: this.isActive,
      refreshInterval: this.refreshInterval,
      subscriptions: Array.from(this.subscribers.keys())
    };
  }
}

// Global dashboard data manager instance
export const dashboardDataManager = new DashboardDataManager();

/**
 * Hook to use dashboard data manager
 * @param {string} key - Unique key
 * @param {Function} fetchFn - Data fetch function
 * @param {Object} options - Configuration options
 * @returns {Object} - Data state and controls
 */
export const useDashboardData = (key, fetchFn, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const updateFn = (newData) => {
      setData(newData);
      setLoading(false);
      setError(null);
      setLastUpdated(new Date());
    };

    const errorFn = (err) => {
      setError(err);
      setLoading(false);
    };

    // Subscribe to data manager
    const unsubscribe = dashboardDataManager.subscribe(
      key,
      fetchFn,
      updateFn,
      { ...options, onError: errorFn }
    );

    return unsubscribe;
  }, [key, fetchFn]);

  const refresh = useCallback(() => {
    setLoading(true);
    dashboardDataManager.fetchData(key);
  }, [key]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

/**
 * Performance monitoring for data operations
 */
export class DataPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Start timing an operation
   * @param {string} operationName - Name of the operation
   */
  startTiming(operationName) {
    this.metrics.set(operationName, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  /**
   * End timing an operation
   * @param {string} operationName - Name of the operation
   */
  endTiming(operationName) {
    const metric = this.metrics.get(operationName);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      
      // Log slow operations (> 2 seconds)
      if (metric.duration > 2000) {
        console.warn(`Slow operation detected: ${operationName} took ${metric.duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Get performance stats
   */
  getStats() {
    const stats = {};
    this.metrics.forEach((metric, name) => {
      stats[name] = {
        duration: metric.duration,
        status: metric.duration ? 'completed' : 'in-progress'
      };
    });
    return stats;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

// Global performance monitor
export const performanceMonitor = new DataPerformanceMonitor();

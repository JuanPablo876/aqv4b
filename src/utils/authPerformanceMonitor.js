/**
 * Performance Monitor for Auth Optimization
 * Tracks and reports authentication request patterns
 */

class AuthPerformanceMonitor {
  constructor() {
    this.metrics = {
      authCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      sessionStart: Date.now()
    };
    
    this.callLog = [];
    this.maxLogEntries = 50;
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Record an auth call
   */
  recordAuthCall(type, responseTime, fromCache = false) {
    this.metrics.authCalls++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.authCalls;
    
    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    // Add to call log
    this.callLog.unshift({
      timestamp: Date.now(),
      type,
      responseTime,
      fromCache,
      id: Math.random().toString(36).substr(2, 9)
    });
    
    // Limit log size
    if (this.callLog.length > this.maxLogEntries) {
      this.callLog = this.callLog.slice(0, this.maxLogEntries);
    }
    
    // Log significant events
    if (responseTime > 1000) {
      console.warn(`⚠️ Slow auth call detected: ${type} took ${responseTime}ms`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const sessionDuration = Date.now() - this.metrics.sessionStart;
    const cacheHitRate = this.metrics.authCalls > 0 
      ? (this.metrics.cacheHits / this.metrics.authCalls * 100).toFixed(1)
      : 0;
    
    return {
      ...this.metrics,
      sessionDuration,
      cacheHitRate: `${cacheHitRate}%`,
      callsPerMinute: this.metrics.authCalls / (sessionDuration / 60000),
      recentCalls: this.callLog.slice(0, 10)
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    
    console.group('🚀 Auth Performance Report');
    console.log('📊 Session Duration:', Math.round(metrics.sessionDuration / 1000), 'seconds');
    console.log('📞 Total Auth Calls:', metrics.authCalls);
    console.log('⚡ Cache Hit Rate:', metrics.cacheHitRate);
    console.log('⏱️ Average Response Time:', Math.round(metrics.averageResponseTime), 'ms');
    console.log('📈 Calls per Minute:', metrics.callsPerMinute.toFixed(2));
    
    if (metrics.recentCalls.length > 0) {
      console.group('📋 Recent Calls:');
      metrics.recentCalls.forEach(call => {
        const timeSince = Math.round((Date.now() - call.timestamp) / 1000);
        const cacheStatus = call.fromCache ? '💾 CACHE' : '🌐 NETWORK';
        console.log(`${cacheStatus} ${call.type}: ${call.responseTime}ms (${timeSince}s ago)`);
      });
      console.groupEnd();
    }
    
    // Performance analysis
    if (parseFloat(metrics.cacheHitRate) > 80) {
      console.log('✅ Excellent cache performance!');
    } else if (parseFloat(metrics.cacheHitRate) > 50) {
      console.log('⚠️ Moderate cache performance - consider optimization');
    } else {
      console.log('❌ Poor cache performance - check AuthManager implementation');
    }
    
    console.groupEnd();
    
    return metrics;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    // Patch AuthManager methods to track performance
    if (typeof window !== 'undefined' && window.authManager) {
      this.patchAuthManager();
    }
    
    // Set up periodic reporting
    this.reportInterval = setInterval(() => {
      if (this.metrics.authCalls > 0) {
        this.generateReport();
      }
    }, 60000); // Report every minute if there's activity
  }

  /**
   * Patch AuthManager to track calls
   */
  patchAuthManager() {
    const authManager = window.authManager;
    if (!authManager) return;

    // Patch getCurrentUser
    const originalGetCurrentUser = authManager.getCurrentUser.bind(authManager);
    authManager.getCurrentUser = async () => {
      const startTime = Date.now();
      const wasFromCache = authManager.isCacheValid();
      
      try {
        const result = await originalGetCurrentUser();
        const endTime = Date.now();
        this.recordAuthCall('getCurrentUser', endTime - startTime, wasFromCache);
        return result;
      } catch (error) {
        const endTime = Date.now();
        this.recordAuthCall('getCurrentUser_ERROR', endTime - startTime, false);
        throw error;
      }
    };

    // Patch initialize
    const originalInitialize = authManager.initialize.bind(authManager);
    authManager.initialize = async () => {
      const startTime = Date.now();
      
      try {
        const result = await originalInitialize();
        const endTime = Date.now();
        this.recordAuthCall('initialize', endTime - startTime, false);
        return result;
      } catch (error) {
        const endTime = Date.now();
        this.recordAuthCall('initialize_ERROR', endTime - startTime, false);
        throw error;
      }
    };

    console.log('📊 Auth performance monitoring enabled');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      authCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      sessionStart: Date.now()
    };
    this.callLog = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      callLog: this.callLog,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Create global instance for easy access
if (typeof window !== 'undefined') {
  window.authPerformanceMonitor = new AuthPerformanceMonitor();
  
  // Add to authManager when it's available
  import('./authManager').then(({ default: authManager }) => {
    window.authManager = authManager;
    if (window.authPerformanceMonitor) {
      window.authPerformanceMonitor.patchAuthManager();
    }
  });
}

export default AuthPerformanceMonitor;

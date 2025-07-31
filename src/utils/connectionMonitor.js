import React from 'react';

class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.connectionLog = [];
    this.startTime = Date.now();
    
    // Monitor online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.log('Browser: Back online');
      this.notifyListeners({ type: 'online' });
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.log('Browser: Gone offline');
      this.notifyListeners({ type: 'offline' });
    });
  }
  
  log(message, details = null) {
    const entry = {
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      message,
      details,
      online: this.isOnline
    };
    
    this.connectionLog.push(entry);
    console.log(`[ConnectionMonitor] ${message}`, details);
    
    // Keep only last 100 entries
    if (this.connectionLog.length > 100) {
      this.connectionLog = this.connectionLog.slice(-100);
    }
  }
  
  async testSupabaseConnection() {
    const testStart = Date.now();
    
    try {
      this.log('Testing Supabase connection...');
      
      // Import here to avoid circular dependencies
      const { supabase } = await import('../supabaseClient');
      
      // Simple auth check
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        this.log('Supabase auth error', error);
        return { success: false, error: error.message, duration: Date.now() - testStart };
      }
      
      // Test a simple query
      const { data: testData, error: queryError } = await supabase
        .from('clients')
        .select('id')
        .limit(1);
      
      if (queryError) {
        this.log('Supabase query error', queryError);
        return { success: false, error: queryError.message, duration: Date.now() - testStart };
      }
      
      const duration = Date.now() - testStart;
      this.log(`Supabase connection successful (${duration}ms)`);
      return { success: true, duration, recordCount: testData?.length || 0 };
      
    } catch (error) {
      const duration = Date.now() - testStart;
      this.log('Supabase connection failed', error);
      return { success: false, error: error.message, duration };
    }
  }
  
  async monitorDatabaseOperation(operationName, operation) {
    const startTime = Date.now();
    this.log(`Starting operation: ${operationName}`);
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      this.log(`Operation completed: ${operationName} (${duration}ms)`, { resultLength: result?.length });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`Operation failed: ${operationName} (${duration}ms)`, error);
      throw error;
    }
  }
  
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in connection monitor listener:', error);
      }
    });
  }
  
  getConnectionReport() {
    return {
      isOnline: this.isOnline,
      uptime: Date.now() - this.startTime,
      logEntries: this.connectionLog.length,
      recentEvents: this.connectionLog.slice(-10),
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }
  
  exportLog() {
    return JSON.stringify({
      report: this.getConnectionReport(),
      fullLog: this.connectionLog
    }, null, 2);
  }
}

// Create singleton instance
export const connectionMonitor = new ConnectionMonitor();

// Export a hook for React components
export const useConnectionMonitor = () => {
  const [connectionState, setConnectionState] = React.useState({
    isOnline: connectionMonitor.isOnline,
    lastUpdate: Date.now()
  });
  
  React.useEffect(() => {
    const unsubscribe = connectionMonitor.addListener((event) => {
      setConnectionState({
        isOnline: connectionMonitor.isOnline,
        lastUpdate: Date.now(),
        event
      });
    });
    
    return unsubscribe;
  }, []);
  
  return connectionState;
};

export default connectionMonitor;

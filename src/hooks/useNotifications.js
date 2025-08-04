import { useState, useEffect, useCallback } from 'react';
import { emailNotificationService } from '../services/emailNotificationService';
import { getLowStockAlerts } from '../utils/inventoryManager';

export const useNotifications = () => {
  const [settings, setSettings] = useState({
    recipients: [],
    enabled: true,
    checkInterval: 6 * 60 * 60 * 1000,
    isRunning: false,
    lastCheck: null
  });
  
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadLowStockItems();
    
    // Initialize the notification service
    emailNotificationService.initialize();

    // Cleanup on unmount
    return () => {
      if (emailNotificationService.isRunning) {
        emailNotificationService.stopMonitoring();
      }
    };
  }, []);

  const loadSettings = useCallback(() => {
    try {
      const currentSettings = emailNotificationService.getSettings();
      setSettings(currentSettings);
    } catch (err) {
      console.error('Error loading notification settings:', err);
      setError(err.message);
    }
  }, []);

  const loadLowStockItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await getLowStockAlerts();
      setLowStockItems(items || []);
    } catch (err) {
      console.error('Error loading low stock items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      emailNotificationService.updateSettings(newSettings);
      loadSettings(); // Reload to get updated state
      return { success: true };
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadSettings]);

  const testNotification = useCallback(async () => {
    try {
      setLoading(true);
      const result = await emailNotificationService.testNotification();
      
      if (!result.success) {
        setError(result.error?.message || 'Error sending test notification');
      }
      
      return result;
    } catch (err) {
      console.error('Error testing notification:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkLowStockNow = useCallback(async () => {
    try {
      setLoading(true);
      await emailNotificationService.checkLowStock();
      loadSettings(); // Update last check time
      await loadLowStockItems(); // Refresh low stock items
      return { success: true };
    } catch (err) {
      console.error('Error checking low stock:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadSettings, loadLowStockItems]);

  const startMonitoring = useCallback(() => {
    try {
      emailNotificationService.startMonitoring();
      loadSettings();
      return { success: true };
    } catch (err) {
      console.error('Error starting monitoring:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadSettings]);

  const stopMonitoring = useCallback(() => {
    try {
      emailNotificationService.stopMonitoring();
      loadSettings();
      return { success: true };
    } catch (err) {
      console.error('Error stopping monitoring:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadSettings]);

  const getNotificationHistory = useCallback(() => {
    try {
      const history = JSON.parse(
        localStorage.getItem('recentLowStockNotifications') || '[]'
      );
      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
      console.error('Error loading notification history:', err);
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    settings,
    lowStockItems,
    loading,
    error,
    
    // Actions
    updateSettings,
    testNotification,
    checkLowStockNow,
    startMonitoring,
    stopMonitoring,
    loadLowStockItems,
    getNotificationHistory,
    clearError,
    
    // Utilities
    isLowStock: lowStockItems.length > 0,
    criticalItems: lowStockItems.filter(item => item.status === 'critical'),
    warningItems: lowStockItems.filter(item => item.status === 'warning')
  };
};

export default useNotifications;

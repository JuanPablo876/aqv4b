import React, { createContext, useContext, useEffect, useState } from 'react';
import PWAManager from '../utils/pwaManager';

const PWAContext = createContext();

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export const PWAProvider = ({ children }) => {
  const [pwaManager, setPwaManager] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Initialize PWA Manager
    const manager = new PWAManager();
    setPwaManager(manager);

    // Set up connectivity monitoring
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for PWA installation
    const checkInstallStatus = () => {
      const isStandalone = window.navigator.standalone || 
                          window.matchMedia('(display-mode: standalone)').matches;
      setIsInstalled(isStandalone);
    };

    checkInstallStatus();

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const value = {
    pwaManager,
    isOnline,
    isInstalled,
    updateAvailable,
    installApp: () => pwaManager?.installApp(),
    updateApp: () => pwaManager?.updateApp(),
    cacheData: (key, data) => pwaManager?.cacheData(key, data),
    getCachedData: (key) => pwaManager?.getCachedData(key),
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      {!isOnline && (
        <div className="offline-indicator show">
          📱 You're offline - Limited functionality available
        </div>
      )}
    </PWAContext.Provider>
  );
};

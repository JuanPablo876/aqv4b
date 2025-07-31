import React from 'react';
import { usePWA } from '../contexts/PWAContext';

const PWAStatus = () => {
  const { isOnline, isInstalled, installApp, updateApp } = usePWA();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Connection Status */}
      <div className={`mb-2 px-3 py-1 rounded-full text-xs font-medium ${
        isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isOnline ? '🌐 Online' : '📱 Offline'}
      </div>

      {/* Install Status */}
      {!isInstalled && (
        <div className="mb-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          💾 Web App
        </div>
      )}

      {isInstalled && (
        <div className="mb-2 px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
          📱 Installed
        </div>
      )}
    </div>
  );
};

export default PWAStatus;

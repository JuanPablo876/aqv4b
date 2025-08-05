import React, { useState, useEffect } from 'react';
import { usePWA } from '../contexts/PWAContext';

const PWATestPage = () => {
  const { isOnline, isInstalled, pwaManager, cacheData, getCachedData } = usePWA();
  const [testResults, setTestResults] = useState({});
  const [cacheTestData, setCacheTestData] = useState('');
  const [cachedValue, setCachedValue] = useState('');

  // Test service worker registration
  useEffect(() => {
    testServiceWorker();
  }, []);

  const testServiceWorker = async () => {
    const results = { ...testResults };

    // Test 1: Service Worker Registration
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        results.serviceWorker = registration ? '✅ Registered' : '❌ Not Registered';
      } catch (error) {
        results.serviceWorker = '❌ Error: ' + error.message;
      }
    } else {
      results.serviceWorker = '❌ Not Supported';
    }

    // Test 2: Cache API
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        results.cacheAPI = `✅ Available (${cacheNames.length} caches)`;
      } catch (error) {
        results.cacheAPI = '❌ Error: ' + error.message;
      }
    } else {
      results.cacheAPI = '❌ Not Supported';
    }

    // Test 3: Background Sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      results.backgroundSync = '✅ Supported';
    } else {
      results.backgroundSync = '❌ Not Supported';
    }

    // Test 4: Push Notifications
    if ('Notification' in window && 'PushManager' in window) {
      results.pushNotifications = '✅ Supported';
    } else {
      results.pushNotifications = '❌ Not Supported';
    }

    // Test 5: Install Prompt
    results.installPrompt = window.addEventListener ? '✅ Event Listeners Available' : '❌ Not Available';

    setTestResults(results);
  };

  const testCache = async () => {
    if (pwaManager && cacheTestData) {
      try {
        await cacheData('test-key', { message: cacheTestData, timestamp: Date.now() });
        alert('✅ Data cached successfully!');
      } catch (error) {
        alert('❌ Cache failed: ' + error.message);
      }
    }
  };

  const testCacheRetrieval = async () => {
    if (pwaManager) {
      try {
        const data = await getCachedData('test-key');
        setCachedValue(data ? JSON.stringify(data, null, 2) : 'No cached data found');
      } catch (error) {
        setCachedValue('❌ Error: ' + error.message);
      }
    }
  };

  const simulateOffline = () => {
    // This would work in a real browser, not in the simple browser
    alert('💡 To test offline functionality:\n\n1. Open DevTools (F12)\n2. Go to Application tab\n3. Check "Offline" in Service Workers section\n4. Refresh the page');
  };

  const triggerInstallPrompt = () => {
    if (pwaManager) {
      pwaManager.installApp();
    } else {
      alert('💡 PWA Manager not available. Try refreshing the page.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background rounded-xl shadow-lg p-8 border">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
            🔧 PWA Functionality Test
          </h1>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-4 rounded-lg text-center ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              <div className="text-2xl mb-2">{isOnline ? '🌐' : '📱'}</div>
              <div className="font-semibold">{isOnline ? 'Online' : 'Offline'}</div>
            </div>

            <div className={`p-4 rounded-lg text-center ${isInstalled ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
              <div className="text-2xl mb-2">{isInstalled ? '📱' : '💾'}</div>
              <div className="font-semibold">{isInstalled ? 'Installed' : 'Web App'}</div>
            </div>

            <div className="p-4 rounded-lg text-center bg-muted text-muted-foreground">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold">PWA Ready</div>
            </div>
          </div>

          {/* Feature Tests */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Feature Support</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(testResults).map(([feature, status]) => (
                <div key={feature} className="p-4 bg-muted rounded-lg">
                  <div className="font-medium text-foreground capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm mt-1 text-muted-foreground">{status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Tests */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Interactive Tests</h2>

            {/* Cache Test */}
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-medium text-foreground mb-4">📦 Cache Test</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={cacheTestData}
                  onChange={(e) => setCacheTestData(e.target.value)}
                  placeholder="Enter data to cache..."
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
                <button
                  onClick={testCache}
                  disabled={!cacheTestData}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cache Data
                </button>
                <button
                  onClick={testCacheRetrieval}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Retrieve Cache
                </button>
              </div>
              {cachedValue && (
                <div className="mt-4 p-3 bg-background rounded border">
                  <strong className="text-foreground">Cached Data:</strong>
                  <pre className="mt-2 text-sm overflow-x-auto text-muted-foreground">{cachedValue}</pre>
                </div>
              )}
            </div>

            {/* Install Test */}
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-medium text-foreground mb-4">📲 Installation Test</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={triggerInstallPrompt}
                  disabled={isInstalled}
                  className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isInstalled ? '✅ Already Installed' : '📲 Install PWA'}
                </button>
                <div className="text-sm text-muted-foreground flex items-center">
                  💡 If the install button doesn't work, look for the install icon in your browser's address bar
                </div>
              </div>
            </div>

            {/* Offline Test */}
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-medium text-foreground mb-4">📱 Offline Test</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={simulateOffline}
                  className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  🔧 Test Offline Mode
                </button>
                <div className="text-sm text-muted-foreground flex items-center">
                  💡 Use browser DevTools to simulate offline conditions
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/50 rounded-lg border">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">🧪 Testing Instructions</h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <div><strong>1. Install PWA:</strong> Click the install button or look for the install icon in your browser</div>
              <div><strong>2. Test Offline:</strong> Use DevTools → Application → Service Workers → Check "Offline"</div>
              <div><strong>3. Cache Test:</strong> Enter data, cache it, then refresh the page and retrieve it</div>
              <div><strong>4. Background Sync:</strong> Go offline, make changes, then go back online</div>
              <div><strong>5. Push Notifications:</strong> Available if your browser supports it</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWATestPage;

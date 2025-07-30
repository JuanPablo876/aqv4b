// Service Worker for AQV4 PWA
// This service worker handles caching of static assets and API requests

const CACHE_NAME = 'aqv4-v1';
const STATIC_CACHE_NAME = 'aqv4-static-v1';
const DATA_CACHE_NAME = 'aqv4-data-v1';

// URLs to cache on install
const STATIC_FILES_TO_CACHE = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // Add more static assets as needed
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching static files');
        return cache.addAll(STATIC_FILES_TO_CACHE);
      })
      .catch((err) => {
        console.log('[ServiceWorker] Pre-cache failed:', err);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DATA_CACHE_NAME && 
              cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  console.log('[ServiceWorker] Fetch:', event.request.url);
  
  // Handle different types of requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/mock/')) {
    // Handle API and mock data requests
    event.respondWith(handleDataRequest(event.request));
  } else if (event.request.destination === 'document') {
    // Handle navigation requests
    event.respondWith(handleNavigationRequest(event.request));
  } else {
    // Handle static asset requests
    event.respondWith(handleStaticRequest(event.request));
  }
});

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // If network fails, serve cached version or fallback
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback - offline page
    return new Response(
      createOfflinePage(),
      {
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'text/html'
        })
      }
    );
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Serve from cache
    return cachedResponse;
  }
  
  try {
    // Try network and cache the response
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed for:', request.url);
    
    // Return a fallback response for critical resources
    if (request.url.includes('.css')) {
      return new Response('/* Offline CSS fallback */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    if (request.url.includes('.js')) {
      return new Response('// Offline JS fallback', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    throw error;
  }
}

// Handle data requests (API calls, mock data)
async function handleDataRequest(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Data request failed, serving from cache:', request.url);
    
    // Serve from cache if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return mock data fallback for specific endpoints
    return createMockDataFallback(request);
  }
}

// Create mock data fallback for offline scenarios
function createMockDataFallback(request) {
  const url = new URL(request.url);
  
  // Basic mock data for different endpoints
  const mockData = {
    '/mock/products': {
      products: [
        {
          id: 'offline-1',
          name: 'Offline Product',
          category: 'Offline',
          price: 0,
          cost: 0,
          stock: 0,
          status: 'Offline - Limited Data'
        }
      ]
    },
    '/mock/clients': {
      clients: [
        {
          id: 'offline-1',
          name: 'Offline Client',
          email: 'offline@example.com',
          status: 'Offline - Limited Data'
        }
      ]
    },
    '/mock/dashboard': {
      stats: {
        totalSales: 'Offline',
        totalProducts: 'Offline',
        totalClients: 'Offline',
        lowStock: 'Offline'
      }
    }
  };
  
  // Check if we have mock data for this path
  const mockResponse = mockData[url.pathname] || { message: 'Offline - No data available' };
  
  return new Response(JSON.stringify(mockResponse), {
    status: 200,
    statusText: 'OK (Cached)',
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  });
}

// Create offline fallback page
function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AQV4 - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-align: center;
        }
        .container {
          max-width: 400px;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 { margin-top: 0; font-size: 2.5em; }
        p { font-size: 1.1em; margin: 20px 0; opacity: 0.9; }
        .icon { font-size: 4em; margin-bottom: 20px; }
        .retry-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1em;
          cursor: pointer;
          margin-top: 20px;
          transition: background 0.3s;
        }
        .retry-btn:hover { background: #2563eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>AQV4 is available offline with limited functionality. Some features may not work until you're back online.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `;
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[ServiceWorker] Background sync triggered');
    event.waitUntil(syncData());
  }
});

// Sync data when back online
async function syncData() {
  try {
    // Here you could implement logic to sync offline changes
    // with your backend when connection is restored
    console.log('[ServiceWorker] Syncing data...');
    
    // Example: Send any pending offline actions to server
    // const pendingActions = await getPendingActions();
    // await sendToServer(pendingActions);
    
  } catch (error) {
    console.log('[ServiceWorker] Sync failed:', error);
  }
}

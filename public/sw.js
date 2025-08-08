// Service Worker for AQV4 PWA
// This service worker handles caching of static assets and API requests

// Version your caches. Update APP_VERSION on each deploy (CI can inject).
const APP_VERSION = '2025-08-08';
const CACHE_PREFIX = 'aqv4';
const STATIC_CACHE_NAME = `${CACHE_PREFIX}-static-${APP_VERSION}`;
const DATA_CACHE_NAME = `${CACHE_PREFIX}-data-${APP_VERSION}`;

// URLs to cache on install
// Do NOT cache '/' or HTML to avoid stale shells; use network-first for navigation
const STATIC_FILES_TO_CACHE = [
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // Add more static assets as needed (prefer hashed filenames)
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install', APP_VERSION);
  
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
  console.log('[ServiceWorker] Activate', APP_VERSION);
  
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DATA_CACHE_NAME && key.startsWith(CACHE_PREFIX)) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Fetch event - navigation network-first; static assets cache-first; leave APIs alone
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Always network-first for navigations (HTML)
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(req));
    return;
  }

  // Only handle same-origin GET static assets; skip APIs and Supabase
  if (
    url.origin === self.location.origin &&
    req.method === 'GET' &&
    !url.pathname.includes('/api/') &&
    !url.pathname.includes('/mock/') &&
    !url.pathname.includes('supabase')
  ) {
    event.respondWith(handleStaticRequest(req));
  }
});

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request, { cache: 'no-store' });
    return networkResponse;
  } catch (error) {
    // If network fails, serve cached fallback (app shell not cached by default)
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/index.html');
    if (cachedResponse) return cachedResponse;
    return new Response(createOfflinePage(), {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'Content-Type': 'text/html' })
    });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;
  try {
    const networkResponse = await fetch(request);
    // Cache successful GET responses, skip HTML/documents
    const ct = networkResponse.headers.get('Content-Type') || '';
    const isHTML = ct.includes('text/html');
    if (networkResponse.status === 200 && request.method === 'GET' && !isHTML) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed for:', request.url);
    if (request.url.includes('.css')) {
      return new Response('/* Offline CSS fallback */', { headers: { 'Content-Type': 'text/css' } });
    }
    if (request.url.includes('.js')) {
      return new Response('// Offline JS fallback', { headers: { 'Content-Type': 'application/javascript' } });
    }
    throw error;
  }
}

// Handle data requests (API calls, mock data)
async function handleDataRequest(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Data request failed, serving from cache:', request.url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    return createMockDataFallback(request);
  }
}

// Create mock data fallback for offline scenarios
function createMockDataFallback(request) {
  const url = new URL(request.url);
  const mockData = {
    '/mock/products': { products: [{ id: 'offline-1', name: 'Offline Product', category: 'Offline', price: 0, cost: 0, stock: 0, status: 'Offline - Limited Data' }] },
    '/mock/clients': { clients: [{ id: 'offline-1', name: 'Offline Client', email: 'offline@example.com', status: 'Offline - Limited Data' }] },
    '/mock/dashboard': { stats: { totalSales: 'Offline', totalProducts: 'Offline', totalClients: 'Offline', lowStock: 'Offline' } }
  };
  const mockResponse = mockData[url.pathname] || { message: 'Offline - No data available' };
  return new Response(JSON.stringify(mockResponse), {
    status: 200,
    statusText: 'OK (Cached)',
    headers: new Headers({ 'Content-Type': 'application/json' })
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: white; text-align: center; }
        .container { max-width: 400px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
        h1 { margin-top: 0; font-size: 2.5em; }
        p { font-size: 1.1em; margin: 20px 0; opacity: 0.9; }
        .icon { font-size: 4em; margin-bottom: 20px; }
        .retry-btn { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1em; cursor: pointer; margin-top: 20px; transition: background 0.3s; }
        .retry-btn:hover { background: #2563eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>AQV4 is available offline with limited functionality. Some features may not work until you're back online.</p>
        <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'PURGE_CACHES') {
    event.waitUntil(purgeCaches());
  }
});

async function purgeCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  await self.registration.unregister().catch(() => {});
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: 'CACHES_PURGED' });
  }
}

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
    console.log('[ServiceWorker] Syncing data...');
  } catch (error) {
    console.log('[ServiceWorker] Sync failed:', error);
  }
}

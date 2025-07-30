// PWA Service Worker Registration and Management

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  async init() {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }

    // Set up PWA install prompt
    this.setupInstallPrompt();
    
    // Set up online/offline detection
    this.setupConnectivityDetection();
    
    // Check if app is already installed
    this.checkInstallStatus();
  }

  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('[PWA] Service Worker registered successfully:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              this.showUpdateAvailable();
            }
          });
        }
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload page when new service worker takes control
        window.location.reload();
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  setupInstallPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt triggered');
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Store the event so it can be triggered later
      this.deferredPrompt = e;
      
      // Show custom install prompt
      this.showInstallPrompt();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed');
      this.isInstalled = true;
      this.hideInstallPrompt();
      this.deferredPrompt = null;
      
      // Show success message
      this.showToast('App installed successfully! 🎉', 'success');
    });
  }

  setupConnectivityDetection() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      this.isOnline = true;
      this.showToast('Connection restored! 🌐', 'success');
      this.syncData();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Gone offline');
      this.isOnline = false;
      this.showToast('You are now offline. Limited functionality available. 📱', 'warning');
    });
  }

  checkInstallStatus() {
    // Check if app is running in standalone mode (installed)
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] App is running as installed PWA');
    }
  }

  showInstallPrompt() {
    const prompt = document.getElementById('pwa-install-prompt');
    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-close-btn');

    if (prompt && !this.isInstalled) {
      prompt.classList.add('show');

      // Install button click handler
      installBtn.onclick = () => {
        this.installApp();
      };

      // Close button click handler
      closeBtn.onclick = () => {
        this.hideInstallPrompt();
      };

      // Auto-hide after 10 seconds
      setTimeout(() => {
        this.hideInstallPrompt();
      }, 10000);
    }
  }

  hideInstallPrompt() {
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
      prompt.classList.remove('show');
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    this.deferredPrompt = null;
    this.hideInstallPrompt();
  }

  showUpdateAvailable() {
    // Show update notification
    this.showToast(
      'A new version is available! Refresh to update. 🔄',
      'info',
      true,
      () => {
        this.updateApp();
      }
    );
  }

  updateApp() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          // Tell the waiting service worker to skip waiting
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  }

  async syncData() {
    // Trigger background sync when back online
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
    }
  }

  showToast(message, type = 'info', persistent = false, action = null) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `pwa-toast pwa-toast-${type}`;
    toast.innerHTML = `
      <div class="pwa-toast-content">
        ${message}
        ${action ? '<button class="pwa-toast-action">Action</button>' : ''}
      </div>
      <button class="pwa-toast-close">&times;</button>
    `;

    // Add styles
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#10b981' : 
                  type === 'warning' ? '#f59e0b' : 
                  type === 'error' ? '#ef4444' : '#3b82f6',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: '10001',
      maxWidth: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      animation: 'slideIn 0.3s ease-out'
    });

    // Add to DOM
    document.body.appendChild(toast);

    // Handle action button
    const actionBtn = toast.querySelector('.pwa-toast-action');
    if (actionBtn && action) {
      actionBtn.onclick = action;
    }

    // Handle close button
    const closeBtn = toast.querySelector('.pwa-toast-close');
    closeBtn.onclick = () => {
      document.body.removeChild(toast);
    };

    // Auto-remove if not persistent
    if (!persistent) {
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 5000);
    }
  }

  // Public API methods
  getConnectionStatus() {
    return this.isOnline;
  }

  getInstallStatus() {
    return this.isInstalled;
  }

  async cacheData(key, data) {
    // Store data in cache for offline access
    if ('caches' in window) {
      const cache = await caches.open('aqv4-data-v1');
      const response = new Response(JSON.stringify(data));
      await cache.put(key, response);
    }
  }

  async getCachedData(key) {
    // Retrieve data from cache
    if ('caches' in window) {
      const cache = await caches.open('aqv4-data-v1');
      const response = await cache.match(key);
      if (response) {
        return await response.json();
      }
    }
    return null;
  }
}

// CSS for animations and additional styles
const pwaStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .pwa-toast-content {
    flex: 1;
    margin-right: 12px;
  }

  .pwa-toast-action {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    margin-left: 8px;
  }

  .pwa-toast-close {
    background: transparent;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    margin-left: 8px;
  }

  .offline-indicator {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ef4444;
    color: white;
    text-align: center;
    padding: 8px;
    font-size: 14px;
    z-index: 10002;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
  }

  .offline-indicator.show {
    transform: translateY(0);
  }
`;

// Inject PWA styles
const styleSheet = document.createElement('style');
styleSheet.textContent = pwaStyles;
document.head.appendChild(styleSheet);

// Export PWA Manager
export default PWAManager;

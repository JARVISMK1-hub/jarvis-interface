// Service Worker for JARVIS PWA
// Handles offline caching and background sync

const CACHE_NAME = 'jarvis-v1';
const urlsToCache = [
  '/jarvis-interface/',
  '/jarvis-interface/index.html',
  '/jarvis-interface/manifest.json',
  '/jarvis-interface/icons/icon-192x192.png',
  '/jarvis-interface/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('JARVIS: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('JARVIS: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('JARVIS: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API calls to backend (always fetch fresh)
  if (event.request.url.includes('jarvis-backend-j123.onrender.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Network failed, return offline page if available
          return caches.match('/jarvis-interface/offline.html');
        });
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Get pending messages from IndexedDB
  const db = await openDB();
  const messages = await db.getAll('pending-messages');
  
  for (const message of messages) {
    try {
      await fetch('https://jarvis-backend-j123.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      await db.delete('pending-messages', message.id);
    } catch (error) {
      console.log('JARVIS: Sync failed for message', message.id);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jarvis-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-messages')) {
        db.createObjectStore('pending-messages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'JARVIS';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/jarvis-interface/icons/icon-192x192.png',
    badge: '/jarvis-interface/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/jarvis-interface/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

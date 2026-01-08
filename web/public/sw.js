/**
 * Service Worker for Roguelike Dungeon Crawler PWA
 *
 * Caches static assets for offline viewing of the app shell.
 * Game functionality requires active WebSocket connection.
 */

const CACHE_NAME = 'roguelike-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip WebSocket requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    return;
  }

  // Skip Vite dev server requests (HMR, source files)
  if (url.pathname.startsWith('/@') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/node_modules/')) {
    return;
  }

  // Skip audio files - let browser handle them directly
  if (url.pathname.startsWith('/audio/')) {
    return;
  }

  // For navigation requests, try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version, but also fetch and update cache in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses for static assets
        if (response.ok && (
          request.url.endsWith('.js') ||
          request.url.endsWith('.css') ||
          request.url.endsWith('.svg') ||
          request.url.endsWith('.png') ||
          request.url.endsWith('.woff2')
        )) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

/** Version: 1.0.1 (Force update) **/
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Service Worker básico para habilitar recursos de PWA
});

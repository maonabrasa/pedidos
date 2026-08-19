const CACHE_NAME = 'maonabrasa-v18';
const assets = ['index.html', 'admin.html', 'styles.css', 'script.js', 'manifest.json', 'maonabrasa.jpg', 'mao-na-brasa-icon.png', 'mao-na-brasa-icon-192.png', 'mao-na-brasa-icon-512.png', 'mao-na-brasa-apple-touch.png', 'maonabrasa-banner.png'];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(assets)));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

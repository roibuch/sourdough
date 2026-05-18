const CACHE_NAME = 'sourdough-master-v2';
const ASSETS = [
    './sourdough_app.html',
    './manifest.json',
    './icon.svg',
    './config.js',
    './sw.js'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(ASSETS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) { return key !== CACHE_NAME; })
                    .map(function (key) { return caches.delete(key); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;

    var url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) return cached;
            return fetch(event.request).then(function (response) {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                var clone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, clone);
                });
                return response;
            }).catch(function () {
                if (event.request.mode === 'navigate') {
                    return caches.match('./sourdough_app.html');
                }
                return caches.match(event.request);
            });
        })
    );
});

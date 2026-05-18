const CACHE_NAME = "sourdough-master-next-v3";

function getBasePath() {
  const scope = self.registration?.scope || self.location.href;
  try {
    const path = new URL(scope).pathname.replace(/\/$/, "");
    if (path && path !== "/") return path;
  } catch {
    /* ignore */
  }
  return "/sourdough";
}

const BASE = getBasePath();

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        `${BASE}/`,
        `${BASE}/index.html`,
        `${BASE}/manifest.json`,
        `${BASE}/icon.svg`,
        `${BASE}/config.js`,
      ]),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Always fetch fresh HTML (avoids stale app without API key)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(`${BASE}/index.html`),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response?.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

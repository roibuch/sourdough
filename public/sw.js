const CACHE_NAME = "sourdough-master-next-v8";

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

function isNextAsset(pathname) {
  return pathname.includes("/_next/") || pathname.endsWith(".js");
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        `${BASE}/`,
        `${BASE}/index.html`,
        `${BASE}/manifest.json`,
        `${BASE}/logo.png`,
        `${BASE}/icon-512x512.png`,
        `${BASE}/config.js`,
      ]),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => caches.open(CACHE_NAME))
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: "window", includeUncontrolled: true }),
      )
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "SW_ACTIVATED_V8" });
        }
      }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(`${BASE}/index.html`)),
    );
    return;
  }

  if (isNextAsset(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response?.status === 200 && response.type === "basic") {
          const type = response.headers.get("content-type") || "";
          if (
            type.includes("image") ||
            (type.includes("css") && !url.pathname.includes("/_next/"))
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

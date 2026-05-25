const CACHE_NAME = "sourdough-master-next-v9";

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
  return (
    pathname.includes("/_next/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css")
  );
}

function isHtmlLike(request, pathname) {
  return (
    request.mode === "navigate" ||
    pathname.endsWith(".html") ||
    pathname === BASE ||
    pathname === `${BASE}/`
  );
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response?.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response?.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  const fresh = await networkPromise;
  return fresh || cached || fetch(request);
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
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: "window", includeUncontrolled: true }),
      )
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "SW_ACTIVATED_V9" });
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

  const fallbackIndex = `${BASE}/index.html`;

  if (isHtmlLike(event.request, url.pathname)) {
    event.respondWith(networkFirst(event.request, fallbackIndex));
    return;
  }

  if (isNextAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

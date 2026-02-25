/* sw.js — safe cache for GitHub Pages, but DO NOT touch Apps Script requests */

const CACHE = "eggcount-v7"; // <- bump this number anytime you change sw.js

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js"
  // add icons here if you have them, e.g. "./icons/icon-192.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ✅ CRITICAL: never intercept/cache Apps Script calls (or googleusercontent redirects)
  if (
    url.hostname.includes("script.google.com") ||
    url.hostname.includes("googleusercontent.com")
  ) {
    event.respondWith(fetch(req));
    return;
  }

  // For normal site files: cache-first, network fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Only cache successful basic (same-origin) responses
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});

// sw.js  — Egg Count
// Bump this version any time you want ALL devices to refresh.
const VERSION = "v6-18pack";
const CACHE_NAME = `eggcount-${VERSION}`;

// Add the files you want available offline:
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting(); // activate new SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // delete old caches
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k.startsWith("eggcount-") && k !== CACHE_NAME) ? caches.delete(k) : null)
    );
    await self.clients.claim(); // take over open pages
  })());
});

// Network-first for HTML so updates show up
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const accept = req.headers.get("accept") || "";
  const isHTML = accept.includes("text/html") || req.destination === "document";

  if (isHTML) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match("./index.html");
      }
    })());
    return;
  }

  // Cache-first for everything else
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  })());
});
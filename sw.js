// sw.js — disabled / safe
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// IMPORTANT: no fetch handler.
// (If there is a fetch handler, it can break API calls and cause "Load failed".)

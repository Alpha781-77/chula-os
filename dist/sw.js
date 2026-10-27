/* Chula OS service worker — cache shell for offline launcher UI */
const CACHE = "chulaos-v1.0.0";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./styles-app.css",
  "./manifest.webmanifest",
  "./VERSION",
  "./js/config.js",
  "./js/storage.js",
  "./js/registry.js",
  "./js/ui.js",
  "./js/launcher.js",
  "./js/router.js",
  "./js/boot.js",
  "./js/home.js",
  "./js/library.js",
  "./js/settings.js",
  "./js/main.js",
  "./assets/wallpaper.svg",
  "./assets/fonts/space-grotesk-latin-400.woff2",
  "./assets/fonts/space-grotesk-latin-500.woff2",
  "./assets/fonts/space-grotesk-latin.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          // Cache same-origin GETs for offline shell resilience
          try {
            const url = new URL(req.url);
            if (url.origin === self.location.origin && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
          } catch (_) {}
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

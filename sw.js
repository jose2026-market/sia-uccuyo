const CACHE = "semillero-ia-v2";
const PRECACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/config.js",
  "./js/i18n.js",
  "./js/i18n-dict.js",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/logo_observatorio.png",
  "./assets/uccuyo_shield.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (!res || res.status !== 200 || res.type !== "basic") return res;
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () {
        if (req.mode === "navigate") return caches.match("./index.html");
        return hit;
      });
    })
  );
});

/* NutriForge — offline shell for static assets (same-origin only). */
var CACHE_NAME = 'nutriforge-v6-11';
var PRECACHE = [
  './index.html',
  './landing.html',
  './manifest.json',
  './t2dm-clinical-field-guide.html',
  './js/backup-core.mjs',
  './js/foods-data.js',
  './js/search-core.js',
  './js/meals-core.js',
  './js/scoring-core.js',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE).catch(function () { return null; });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  try {
    var url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    /* Never cache gated protocol routes or session endpoint */
    var p = url.pathname;
    if (
      p === '/protocol' ||
      p.indexOf('/protocol/') === 0 ||
      p === '/api/protocol-session' ||
      p === '/api/protocol-pdf' ||
      p === '/api/protocol-guide'
    ) {
      event.respondWith(fetch(event.request));
      return;
    }
  } catch (e) { return; }

  /* HTML navigations: network-first so landing/app shells are not stuck on stale cached HTML. */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response && response.status === 200 && response.type === 'basic') {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(event.request, { ignoreSearch: false }).then(function (cached) {
            if (cached) return cached;
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: false }).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      }).catch(function () {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});

const CACHE = 'animeai-v4';
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/','/anime','/static/style.css','/static/script.js','/static/anime.js']))));
self.addEventListener('fetch', e => e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));

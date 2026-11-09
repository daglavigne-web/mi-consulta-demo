const CACHE_NAME = 'mi-consulta-shell-v2';
const ROOT = new URL('./', self.location.href);
const SHELL = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'].map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && (key.startsWith('mi-consulta-demo-') || key.startsWith('mi-consulta-shell-'))).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const request = event.request;
 const url = new URL(request.url);
 // Only the public app shell is cached. Supabase and other origins always use the network.
 if (request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
 const navigation = request.mode === 'navigate';
 const pathUrl = url.origin + url.pathname;
 if (!navigation && !SHELL.includes(pathUrl)) return;
 const cacheKey = navigation ? new URL('index.html', ROOT).href : pathUrl;
 event.respondWith((async () => {
  try {
   const response = await fetch(request, {cache: 'no-store'});
   if (response.ok && response.type === 'basic') {
    try {
     const cache = await caches.open(CACHE_NAME);
     await cache.put(cacheKey, response.clone());
    } catch (_) { /* A cache failure must not replace a fresh response with stale content. */ }
   }
   return response;
  } catch (error) {
   const cached = await caches.match(cacheKey);
   return cached || Response.error();
  }
 })());
});

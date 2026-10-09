/* LexiVault Service Worker
   HTML/JS/manifest 永远走网络，只缓存图片
   以后改 index.html 不用再动这个文件 */

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // HTML / JS / manifest.json / 根路径 → 永远走网络，完全不缓存
  if (/\.(html|js|json)$/i.test(url.pathname) || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match(req))
    );
    return;
  }

  // 图片等其他静态资源 → 网络优先 + 缓存加速
  e.respondWith(
    fetch(req).then(resp => {
      if (resp && resp.ok && resp.type === 'basic') {
        const copy = resp.clone();
        caches.open('lexivault-static').then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(req))
  );
});
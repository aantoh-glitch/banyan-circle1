// Banyan Circle Service Worker — PWA + Web Push
const CACHE = 'bc-v3';
const ASSETS = ['/login.html', '/index.html', '/guest.html', '/owner.html', '/css/app.css', '/js/supabase.js', '/js/push.js', '/manifest.json'];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// Push notification received
self.addEventListener('push', e => {
  let data = { title: 'Banyan Circle', body: 'You have a new update', url: '/index.html', role: 'all' };
  try { data = { ...data, ...e.data.json() }; } catch(err) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [{ action: 'open', title: 'View' }, { action: 'dismiss', title: 'Dismiss' }]
    })
  );
});

// Notification click — open the right page
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/index.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', e => {
  if (e.tag === 'bc-sync') {
    e.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  const db = await openDB();
  const pending = await db.getAll('pending');
  for (const item of pending) {
    try {
      await fetch(item.url, { method: item.method, headers: item.headers, body: item.body });
      await db.delete('pending', item.id);
    } catch(err) {}
  }
}

// Simple IndexedDB helper for offline queue
function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('bc-offline', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = e => res({
      getAll: store => new Promise((r, j) => { const t = e.target.result.transaction(store,'readonly'); const s = t.objectStore(store); const req = s.getAll(); req.onsuccess = () => r(req.result); req.onerror = j; }),
      delete: (store, id) => new Promise((r, j) => { const t = e.target.result.transaction(store,'readwrite'); t.objectStore(store).delete(id); t.oncomplete = r; t.onerror = j; })
    });
    req.onerror = rej;
  });
}

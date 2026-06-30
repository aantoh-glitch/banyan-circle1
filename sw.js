const CACHE = 'heritance-v2';
const PRECACHE = [
  '/offlogin.html',
  '/admin.html',
  '/manifest-office.json',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
 
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});
 
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
 
self.addEventListener('fetch', e => {
  // Network-first for API calls; cache-first for assets
  if (e.request.url.includes('supabase') || e.request.url.includes('/rest/v1')) {
    return; // always go to network for auth/data
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Push: show notification ──
self.addEventListener('push', function(e) {
  if (!e.data) return;
  let data;
  try {
    data = e.data.json();
  } catch (err) {
    return; // ignore non-JSON test pushes
  }
  const title = data.title || 'Heritance';
  const options = {
    body:     data.body  || '',
    icon:     '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    tag:      data.tag   || 'heritance-notif',
    renotify: true,
    data:     { url: data.url || '/ops.html' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click: open/focus the app ──
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/ops.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
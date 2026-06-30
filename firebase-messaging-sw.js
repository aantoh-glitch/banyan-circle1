importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC6-7BijSXxyav4soPrGOHhRuuMu0p-nck",
  authDomain: "propertiesbyheritance.firebaseapp.com",
  projectId: "propertiesbyheritance",
  storageBucket: "propertiesbyheritance.firebasestorage.app",
  messagingSenderId: "218982671642",
  appId: "1:218982671642:web:448da81964e195d74ff8a3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || payload.data?.title || 'Heritance';
  const options = {
    body:  payload.notification?.body || payload.data?.body || '',
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data:  { url: payload.data?.url || '/ops.html' }
  };
  self.registration.showNotification(title, options);
});

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
const CACHE_NAME = 'salati-egypt-v3';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './timer-worker.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

const DB_NAME = 'prayer-reminder-db';
const STORE_NAME = 'pendingActions';

function openActionsDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePendingAction(action) {
  const db = await openActionsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(action);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  notification.close();

  const dateKey = data.dateKey;
  const prayerIds = Array.isArray(data.prayerIds) ? data.prayerIds : [];

  if (action === 'mark-prayed' || action === 'snooze-15') {
    const payload = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: action === 'mark-prayed' ? 'MARK_PRAYED' : 'SNOOZE_PRAYERS',
      dateKey,
      prayerIds,
      minutes: action === 'snooze-15' ? 15 : undefined,
      timestamp: Date.now(),
    };

    event.waitUntil(
      (async () => {
        await savePendingAction(payload);
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of windowClients) {
          client.postMessage(payload);
        }
      })(),
    );
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('./');
        }
        return undefined;
      }),
  );
});

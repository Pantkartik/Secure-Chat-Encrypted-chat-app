// Cypher Chat Custom Service Worker for Android PWA
// This extends the existing workbox service worker with Android-specific features

// Import the existing workbox service worker
importScripts('./sw.js');

// Android-specific push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New secure message received',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'cypher-chat-notification',
    actions: [
      {
        action: 'reply',
        title: 'Quick Reply',
        icon: '/icons/shortcut-chat.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-close.png'
      }
    ],
    // Android-specific options
    requireInteraction: true,
    silent: false,
    renotify: true,
    timestamp: Date.now()
  };
  
  event.waitUntil(
    self.registration.showNotification('Cypher Chat', options)
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'reply') {
    // Handle quick reply
    event.waitUntil(
      clients.openWindow('/auth/chat')
        .then((client) => {
          if (client) {
            client.postMessage({
              type: 'QUICK_REPLY',
              data: event.notification.data
            });
          }
        })
    );
  } else if (event.action === 'dismiss') {
    return;
  } else {
    // Handle notification click
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes('/auth/chat') && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/auth/chat');
        }
      })
    );
  }
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages());
  } else if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts());
  }
});

// Sync offline messages
async function syncOfflineMessages() {
  try {
    const cache = await caches.open('cypher-chat-v1');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/messages')) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.delete(request);
            // Notify the app about successful sync
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'MESSAGE_SYNCED',
                  data: { url: request.url }
                });
              });
            });
          }
        } catch (error) {
          console.error('Failed to sync message:', error);
        }
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Sync contacts
async function syncContacts() {
  try {
    const response = await fetch('/api/contacts/sync');
    if (response.ok) {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'CONTACTS_SYNCED',
            data: await response.json()
          });
        });
      });
    }
  } catch (error) {
    console.error('Contacts sync failed:', error);
  }
}

// Handle app install prompt for Android
self.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  self.installPrompt = event;
  
  // Store the event for later use
  self.installPromptEvent = event;
  
  // Notify all clients that install is available
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'INSTALL_AVAILABLE',
        data: true
      });
    });
  });
});

// Handle app installed
self.addEventListener('appinstalled', (event) => {
  console.log('Cypher Chat PWA was installed');
  
  // Notify all clients about installation
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'APP_INSTALLED',
        data: true
      });
    });
  });
});

// Handle periodic background sync (if available)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-messages') {
      event.waitUntil(checkForNewMessages());
    }
  });
}

// Check for new messages
async function checkForNewMessages() {
  try {
    const response = await fetch('/api/messages/unread');
    if (response.ok) {
      const data = await response.json();
      if (data.unreadCount > 0) {
        // Show notification for unread messages
        self.registration.showNotification('Cypher Chat', {
          body: `You have ${data.unreadCount} unread messages`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'unread-messages',
          requireInteraction: false
        });
      }
    }
  } catch (error) {
    console.error('Failed to check for new messages:', error);
  }
}

// Handle share target (Android share functionality)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/share-target')) {
    event.respondWith(handleShareTarget(event.request));
  }
});

// Handle shared content
async function handleShareTarget(request) {
  const formData = await request.formData();
  const sharedText = formData.get('text');
  const sharedFiles = formData.getAll('files');
  
  // Store shared content temporarily
  const cache = await caches.open('shared-content');
  await cache.put('shared-data', new Response(JSON.stringify({
    text: sharedText,
    files: sharedFiles.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size
    }))
  })));
  
  // Redirect to chat with shared content
  return Response.redirect('/auth/chat?shared=true', 303);
}

console.log('Cypher Chat Custom Service Worker loaded with Android enhancements');
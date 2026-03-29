self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  let title = 'DealSphere';
  let options = {
    body: 'You have a new deal!',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options = {
        body: data.body || options.body,
        data: data.data || {},
        icon: '/favicon.ico'
      };
    } catch (e) {
      console.log('Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url == '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

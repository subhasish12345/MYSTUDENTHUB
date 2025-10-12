// This service worker file is intentionally left almost empty.
// It is required for Firebase Cloud Messaging to work in the background.

// The presence of this file allows the browser to show notifications
// when your app is not in the foreground.

// You can add custom background message handling logic here if needed.
// For example, you could customize notification clicks.

// For now, we'll just log that the service worker is active.
console.log("Firebase Messaging Service Worker initialized.");

self.addEventListener('push', (event) => {
  const notificationData = event.data.json();
  const title = notificationData.notification.title;
  const options = {
    body: notificationData.notification.body,
    icon: notificationData.notification.icon,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Add logic to open a specific URL on notification click
});

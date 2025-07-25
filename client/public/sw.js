// Service worker for notifications and background sync
let userId = null;
let lastNotificationCheck = Date.now();
let checkInterval = null;

self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Listen for messages from main thread
self.addEventListener('message', function(event) {
  console.log('SW received message:', event.data);
  
  if (event.data.type === 'SET_USER_ID') {
    userId = event.data.userId;
    console.log('SW: User ID set to', userId);
    
    // Start background checking if user is logged in
    if (userId && !checkInterval) {
      startBackgroundNotificationCheck();
    }
  } else if (event.data.type === 'STOP_BACKGROUND_CHECK') {
    stopBackgroundNotificationCheck();
  }
});

// Background notification checking
function startBackgroundNotificationCheck() {
  console.log('SW: Starting background notification check for user', userId);
  
  // Check immediately first
  checkForNewNotifications();
  
  // Then check every 30 seconds
  checkInterval = setInterval(() => {
    checkForNewNotifications();
  }, 30000);
}

function stopBackgroundNotificationCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('SW: Stopped background notification check');
  }
}

async function checkForNewNotifications() {
  if (!userId) return;
  
  try {
    const response = await fetch(`/api/notifications/${userId}`);
    if (!response.ok) {
      console.log('SW: Failed to fetch notifications:', response.status);
      return;
    }
    
    const data = await response.json();
    const notifications = data.notifications || [];
    
    // Find new notifications since last check
    const newNotifications = notifications.filter(notification => {
      const notificationTime = new Date(notification.createdAt).getTime();
      return notificationTime > lastNotificationCheck && 
             notification.type === 'share_request' && 
             !notification.isRead;
    });
    
    if (newNotifications.length > 0) {
      console.log('SW: Found', newNotifications.length, 'new notifications');
      
      // Show notification for each new share request
      newNotifications.forEach(notification => {
        let metadata = {};
        try {
          metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
        } catch (e) {
          console.error('SW: Error parsing notification metadata:', e);
        }
        
        self.registration.showNotification('SpaceBSA - File được chia sẻ', {
          body: notification.message || 'Bạn có file mới được chia sẻ',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `share-${notification.id}`,
          requireInteraction: true, // Keep notification until user interacts
          data: { 
            notificationId: notification.id, 
            shareId: metadata.shareId,
            type: 'share_request'
          },
          actions: [
            {
              action: 'open',
              title: 'Mở ứng dụng'
            },
            {
              action: 'dismiss',
              title: 'Bỏ qua'
            }
          ]
        });
      });
    }
    
    // Update last check time
    lastNotificationCheck = Date.now();
    
  } catch (error) {
    console.error('SW: Error checking notifications:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();
  
  // Focus the window if it's open
  event.waitUntil(
    self.clients.matchAll().then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Handle push events (for future use)
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'spacebsa-push',
      requireInteraction: false,
      ...data.options
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});
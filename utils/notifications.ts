// src/utils/notifications.ts
'use client';

export function testNotifications() {
  // Create a test notification when Do Not Disturb is OFF
  const createTestNotification = () => {
    new Notification('Test Notification', {
      body: 'This is a test notification',
      icon: '/favicon.ico',
    });
  };

  // Check if we have permission
  if (Notification.permission === 'granted') {
    createTestNotification();
  } else {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        createTestNotification();
      } else {
        console.log('Notification permission denied');
      }
    });
  }
}

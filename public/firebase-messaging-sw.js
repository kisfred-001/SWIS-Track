/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the messagingSenderId
firebase.initializeApp({
  messagingSenderId: '988205096105',
  projectId: 'quadratic-tide-wpthm',
  appId: '1:988205096105:web:51ab661953901021239db8'
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'SWIS Track - Urgent Edit Request';
  const notificationOptions = {
    body: payload.notification?.body || 'An urgent attendance edit request was submitted by a teacher.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
    tag: 'urgent-edit-request',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

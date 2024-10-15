self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('my-cache').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/chapter.html',
                '/questions.html',
                '/admin.html',
                '/css/style.css',
                '/js/app.js',
                '/icon-192x192.png',
                '/icon-512x512.png'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyCmpiBFNmEm9BTaOWS5S7blm6hBm75yiOw",
    authDomain: "daily-bible-reading-6903b.firebaseapp.com",
    databaseURL: "https://daily-bible-reading-6903b-default-rtdb.firebaseio.com",
    projectId: "daily-bible-reading-6903b",
    storageBucket: "daily-bible-reading-6903b.appspot.com",
    messagingSenderId: "422582479606",
    appId: "1:422582479606:web:017168d5b9d2f23a8a9ad7",
    measurementId: "G-XEN3V1MB2Z"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// عند استلام رسالة دفع
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192x192.png', // مسار الأيقونة
    };

    // إظهار الإشعار
    self.registration.showNotification(notificationTitle, notificationOptions);
});

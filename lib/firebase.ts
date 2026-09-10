import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
} from "firebase/messaging";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const RAW_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const VAPID_KEY = RAW_VAPID_KEY?.trim().replace(/^['"]|['"]$/g, "");

const isValidVapidKey = (key: string | undefined): boolean => {
  if (!key) return false;
  // Firebase web-push VAPID public key is URL-safe base64, ~87-88 chars, starts with 'B'
  if (key.length < 80 || key.length > 100) return false;
  if (!/^B[A-Za-z0-9_-]+$/.test(key)) return false;
  return true;
};

const SW_PATH = "/firebase-messaging-sw.js";

export const getFirebaseApp = (): FirebaseApp =>
  getApps().length ? getApp() : initializeApp(firebaseConfig);

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined") return null;
  try {
    const supported = await isSupported();
    console.log("🔔 [push][lib] isSupported:", supported);
    if (!supported) return null;
    return getMessaging(getFirebaseApp());
  } catch (error) {
    console.error("❌ [push][lib] getFirebaseMessaging error:", error);
    return null;
  }
};

// Resolve once the registration has an *active* worker. PushManager.subscribe
// (used by getToken) fails with AbortError if the SW isn't active yet, which
// happens when a registration exists but is still installing/waiting.
const waitForActiveWorker = (reg: ServiceWorkerRegistration): Promise<void> => {
  if (reg.active) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const worker = reg.installing || reg.waiting;
    if (!worker) {
      navigator.serviceWorker.ready.then(() => resolve());
      return;
    }
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") resolve();
    });
  });
};

export const ensureFirebaseSwRegistered =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.warn("⚠️ [push][lib] serviceWorker not available");
      return null;
    }
    try {
      let reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      if (reg) {
        console.log(
          "🔔 [push][lib] SW already registered:",
          reg.scope,
          "active:",
          !!reg.active,
        );
      } else {
        reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
        console.log("🔔 [push][lib] SW registered:", reg.scope);
      }
      await waitForActiveWorker(reg);
      console.log("✅ [push][lib] SW is ready (active)");
      return reg;
    } catch (error) {
      console.error("❌ [push][lib] SW registration failed:", error);
      return null;
    }
  };

export const requestFcmToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) {
    console.warn("⚠️ [push][lib] Notification API not available");
    return null;
  }
  if (!VAPID_KEY) {
    console.warn("⚠️ [push][lib] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set");
    return null;
  }
  if (!isValidVapidKey(VAPID_KEY)) {
    console.error("❌ [push][lib] VAPID key looks malformed", {
      length: VAPID_KEY.length,
      startsWithB: VAPID_KEY.startsWith("B"),
      hint: "Use the 'Web Push certificates' key from Firebase Console → Project Settings → Cloud Messaging. URL-safe base64, ~88 chars, starts with B.",
    });
    return null;
  }
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    !firebaseConfig.messagingSenderId
  ) {
    console.warn("⚠️ [push][lib] Firebase config env vars are missing", {
      hasApiKey: !!firebaseConfig.apiKey,
      hasProjectId: !!firebaseConfig.projectId,
      hasSenderId: !!firebaseConfig.messagingSenderId,
    });
    return null;
  }

  let permission = Notification.permission;
  console.log("🔔 [push][lib] current permission:", permission);
  if (permission === "default") {
    permission = await Notification.requestPermission();
    console.log("🔔 [push][lib] permission after prompt:", permission);
  }
  if (permission !== "granted") {
    console.warn("⚠️ [push][lib] permission not granted, aborting");
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const swRegistration = await ensureFirebaseSwRegistered();
  if (!swRegistration) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
    console.log("✅ [push][lib] getToken result:", token ? `${token}…` : null);
    return token || null;
  } catch (error) {
    console.error("❌ [push][lib] getToken error:", error);
    return null;
  }
};

export const listenForegroundFcmMessages = (
  callback: (payload: MessagePayload) => void,
): (() => void) => {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  getFirebaseMessaging().then((messaging) => {
    if (!messaging || cancelled) return;
    unsubscribe = onMessage(messaging, callback);
  });

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
};

/** Generates the firebase-messaging-sw.js content, served by app/firebase-messaging-sw.js/route.ts. Kept here so the config is defined once instead of duplicated in a static public/ file. */
export const generateServiceWorker = () => `
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

self.addEventListener('install', () => {
  console.log('[push-sw] install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[push-sw] activate');
  event.waitUntil(self.clients.claim());
});

firebase.initializeApp({
  apiKey: '${firebaseConfig.apiKey ?? ""}',
  authDomain: '${firebaseConfig.authDomain ?? ""}',
  projectId: '${firebaseConfig.projectId ?? ""}',
  storageBucket: '${firebaseConfig.storageBucket ?? ""}',
  messagingSenderId: '${firebaseConfig.messagingSenderId ?? ""}',
  appId: '${firebaseConfig.appId ?? ""}',
  measurementId: '${firebaseConfig.measurementId ?? ""}',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[push-sw] onBackgroundMessage payload:', payload);

  const data = payload.data || {};
  const notif = payload.notification || {};

  const title = notif.title || data.title || 'Tredro';
  const options = {
    body: notif.body || data.body || '',
    icon: notif.icon || data.icon || '/tredro/logo.svg',
    tag: data.tag || payload.messageId,
    data,
  };

  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[push-sw] notificationclick:', event.notification);
  event.notification.close();

  // The routing decision (which screen a given event_key opens) lives once,
  // client-side, in module/notifications/lib/notification-routing.ts — this
  // just hands the raw data over instead of duplicating that map here.
  const data = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.postMessage({ type: 'notification-click', title: event.notification.title, body: event.notification.body, data });
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/notifications');
      }
    })
  );
});
`;

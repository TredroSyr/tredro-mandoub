import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  ensureFirebaseSwRegistered,
  listenForegroundFcmMessages,
  requestFcmToken,
} from "@/lib/firebase";
import { resolveNotificationUrl } from "./notification-routing";

/** Normalized shape both the native and web paths reduce down to, so the rest of the app handles push in one standard way. */
export interface PushPayload {
  title: string;
  body: string;
  /** The inbox row id (backend §5 `data.notification_id`) — needed to mark it read on tap. */
  notificationId?: string;
  url: string;
}

/** Every value in FCM's `data` block is a string (backend §5). */
const buildPayload = (
  title: string,
  body: string,
  data: Record<string, unknown> | undefined,
): PushPayload => ({
  title,
  body,
  notificationId: data?.notification_id ? String(data.notification_id) : undefined,
  url: resolveNotificationUrl(data?.event_key as string | undefined, data),
});

export interface PushHandlers {
  onToken: (token: string) => void;
  /** Notification arrived while the app/tab was open and visible. */
  onForegroundNotification: (payload: PushPayload) => void;
  /** User tapped a notification (from the OS tray, on native, or from the service worker on web). */
  onNotificationTap: (payload: PushPayload) => void;
}

const registerNative = async (handlers: PushHandlers) => {
  console.log("🔔 [push] native platform detected, requesting permission...");
  const permission = await PushNotifications.requestPermissions();
  console.log("🔔 [push] native permission result:", permission);
  if (permission.receive !== "granted") {
    console.warn("⚠️ [push] native permission not granted, aborting");
    return;
  }

  await PushNotifications.addListener("registration", (token) => {
    console.log("✅ [push] native FCM token received:", token.value);
    handlers.onToken(token.value);
  });

  await PushNotifications.addListener("registrationError", (error) => {
    console.error("❌ [push] native registration error:", error);
  });

  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("📩 [push] native foreground notification:", notification);
    handlers.onForegroundNotification(
      buildPayload(
        notification.title || "Tredro",
        notification.body || "",
        notification.data,
      ),
    );
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const { notification } = action;
    console.log("👆 [push] native notification tapped:", notification);
    handlers.onNotificationTap(
      buildPayload(
        notification.title || "Tredro",
        notification.body || "",
        notification.data,
      ),
    );
  });

  await PushNotifications.register();
  console.log("🔔 [push] native register() called");
};

const registerWeb = async (handlers: PushHandlers) => {
  console.log("🔔 [push] web platform detected, starting registration...");

  if (typeof window === "undefined") return;

  // Background notifications (tab closed/hidden) need an active SW regardless
  // of whether getToken() below succeeds.
  await ensureFirebaseSwRegistered();

  const token = await requestFcmToken();
  if (token) {
    handlers.onToken(token);
  } else {
    console.warn(
      "⚠️ [push] no token returned (permission denied, unsupported, or missing config/VAPID key — see [push][lib] logs above)",
    );
  }

  console.log("🔔 [push] onMessage listener attached — waiting for pushes");

  // Fires only while this tab is open — background messages are handled by
  // the service worker (app/firebase-messaging-sw.js/route.ts) instead.
  listenForegroundFcmMessages((payload) => {
    console.log("📩 [push] raw onMessage payload:", payload);
    console.log("🔔 [push] document.visibilityState:", document.visibilityState);
    handlers.onForegroundNotification(
      buildPayload(
        payload.notification?.title || payload.data?.title || "Tredro",
        payload.notification?.body || payload.data?.body || "",
        payload.data,
      ),
    );
  });

  // The service worker posts this when the user clicks a notification it showed
  // in the background (see the `notificationclick` handler in generateServiceWorker()).
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "notification-click") return;
    console.log("👆 [push] web notification tapped (from SW):", event.data);
    handlers.onNotificationTap(
      buildPayload(
        event.data.title || "Tredro",
        event.data.body || "",
        event.data.data,
      ),
    );
  });
};

/** Requests permission and registers for push on whichever platform we're running on. */
export const registerForPushNotifications = async (handlers: PushHandlers) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await registerNative(handlers);
    } else {
      await registerWeb(handlers);
    }
  } catch (error) {
    console.error("❌ [push] registration threw an error:", error);
  }
};

"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { toast } from "@/components/ui/toast";
import {
  useMarkNotificationReadMutation,
  useRegisterNotificationDeviceMutation,
} from "./index";
import {
  registerForPushNotifications,
  PushPayload,
} from "../lib/push-notifications";
import { playNotificationSound } from "../lib/notification-sound";
import { DevicePlatform } from "../types";

export const FCM_TOKEN_STORAGE_KEY = "fcm_token";

// Dedup concurrent registrations (StrictMode double-effect in dev).
let registrationInFlight = false;

/** Registers for push notifications once and sends the resulting token to the backend. */
export const useRegisterPushNotifications = (enabled: boolean) => {
  const { mutate: registerDevice } = useRegisterNotificationDeviceMutation();
  const { mutate: markRead } = useMarkNotificationReadMutation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!enabled) {
      console.log("🔔 [push] not enabled yet (rep not authenticated)");
      return;
    }
    if (hasRegistered.current || registrationInFlight) return;
    hasRegistered.current = true;
    registrationInFlight = true;

    console.log("🔔 [push] rep authenticated, starting push registration");

    const showNotificationToast = (payload: PushPayload) => {
      playNotificationSound();
      toast.info(payload.title, {
        description: payload.body,
        timeout: 6000,
        actionProps: {
          children: "عرض",
          onClick: () => {
            if (payload.notificationId) markRead(payload.notificationId);
            router.push(payload.url);
          },
        },
      });

      // If the tab isn't actually visible (open in a background tab), the
      // in-page toast above won't be seen — fall back to a real OS notification.
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible" &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(payload.title, { body: payload.body });
        } catch (error) {
          console.warn("⚠️ [push] OS notification fallback failed:", error);
        }
      }
    };

    registerForPushNotifications({
      onToken: (token) => {
        const lastSent =
          typeof window !== "undefined"
            ? window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
            : null;

        if (lastSent === token) {
          console.log("🔔 [push] token unchanged since last send, skipping POST");
          registrationInFlight = false;
          return;
        }

        const platform: DevicePlatform = Capacitor.isNativePlatform()
          ? (Capacitor.getPlatform() as DevicePlatform)
          : "web";

        registerDevice(
          { token, platform },
          {
            onSuccess: () => {
              console.log("✅ [push] device registered:", platform);
              window.localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
              registrationInFlight = false;
            },
            onError: (error) => {
              console.error("❌ [push] failed to register device:", error);
              registrationInFlight = false;
            },
          },
        );
      },
      onForegroundNotification: (payload) => {
        console.log("📩 [push] foreground notification:", payload);
        showNotificationToast(payload);
        // A new notification landed — refresh the bell badge/list rather than
        // guessing at the new unread count client-side.
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
      onNotificationTap: (payload) => {
        console.log("👆 [push] notification tapped:", payload);
        if (payload.notificationId) {
          markRead(payload.notificationId);
        }
        router.push(payload.url);
      },
    }).finally(() => {
      // Safety net for paths that never call onToken (denied permission,
      // unsupported browser, etc.) — otherwise registrationInFlight would
      // stay stuck true and block every future attempt.
      registrationInFlight = false;
    });
  }, [enabled, registerDevice, markRead, queryClient, router]);
};

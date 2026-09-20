"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { subscribeOutboxChanges } from "@/lib/db/outbox";
import { isNativeApp } from "@/lib/native";
import { reconcileSyncReminder } from "@/lib/sync/reminder";

// A burst of outbox writes (a flush marks and removes several items) should
// produce one reminder update, not one per write.
const DEBOUNCE_MS = 1000;

/**
 * Keeps the "you have items waiting" reminder in step with the outbox.
 * Native app only — renders nothing.
 */
export function SyncReminder() {
  // Going offline arms the "connection is back" notification and coming back
  // online disarms it, so a connectivity change must re-evaluate too.
  const { connected } = useNetworkStatus();

  useEffect(() => {
    if (!isNativeApp()) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void reconcileSyncReminder(), DEBOUNCE_MS);
    };

    scheduleUpdate(); // on launch
    const unsubscribe = subscribeOutboxChanges(scheduleUpdate);
    // Leaving the app is the moment the reminder matters: make sure it is
    // current before we go.
    const pause = App.addListener("appStateChange", (state) => {
      if (!state.isActive) void reconcileSyncReminder();
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      pause.then((h) => h.remove()).catch(() => {});
    };
  }, [connected]);

  return null;
}

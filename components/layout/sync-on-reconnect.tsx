"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { isNativeApp } from "@/lib/native";
import { flushOutbox } from "@/lib/sync/flush-outbox";

// Safety net for the gap between "the radio says connected" and "the
// internet actually works" (captive Wi-Fi, DNS still warming up): if the
// first flush after a reconnect fails, try again instead of waiting for
// another connectivity event that may never come.
const RETRY_INTERVAL_MS = 20_000;

/**
 * Drives the outbox flush. Native app only — renders nothing.
 *
 *  - on mount (items may be left over from a previous offline session)
 *  - whenever connectivity comes back
 *  - whenever the app returns to the foreground
 *  - every 20s while connected, as a retry safety net
 *
 * iOS/Android won't reliably let us sync in the background, so all of these
 * are foreground triggers by design.
 */
export function SyncOnReconnect() {
  const { connected } = useNetworkStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isNativeApp() || !connected) return;

    let cancelled = false;
    const run = async () => {
      const synced = await flushOutbox();
      if (cancelled || synced === 0) return;
      // A replayed write happens outside any component's mutation
      // lifecycle, so the invalidate-on-success in each hook never ran.
      queryClient.invalidateQueries();
    };

    void run();
    const interval = setInterval(run, RETRY_INTERVAL_MS);
    const resume = App.addListener("appStateChange", (state) => {
      if (state.isActive) void run();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      resume.then((h) => h.remove()).catch(() => {});
    };
  }, [connected, queryClient]);

  return null;
}

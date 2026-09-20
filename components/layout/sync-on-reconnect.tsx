"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { isNativeApp } from "@/lib/native";
import { flushOutbox } from "@/lib/sync/flush-outbox";
import { acknowledgeSyncLog, isSummaryBusy } from "@/lib/sync/sync-log";

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
 * These are all *foreground* triggers: nothing here runs once the app has
 * been closed. When the rep next opens it, the launch summary reports what
 * went through (see SyncSummary).
 */
export function SyncOnReconnect() {
  const { connected } = useNetworkStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isNativeApp() || !connected) return;

    let cancelled = false;
    const run = async () => {
      const { synced, failed } = await flushOutbox();
      if (cancelled) return;
      // A replayed write happens outside any component's mutation
      // lifecycle, so the invalidate-on-success in each hook never ran.
      if (synced > 0) queryClient.invalidateQueries();
      // While the launch summary is open it reports these itself.
      if (isSummaryBusy()) return;
      if (synced > 0) {
        toast.success(`تمت مزامنة ${synced} ${synced === 1 ? "عنصر" : "عناصر"}`);
        acknowledgeSyncLog();
      }
      if (failed > 0) {
        toast.error(`تعذّرت مزامنة ${failed} — راجع «عناصر المزامنة»`);
      }
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

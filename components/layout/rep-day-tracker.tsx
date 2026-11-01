"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { toast } from "@/components/ui/toast";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useRepDay } from "@/module/tracking/hooks";
import { flushTrackingQueue } from "@/module/tracking/lib/queue";
import { startTracking, stopTracking } from "@/module/tracking/lib/tracker";

const RETRY_INTERVAL_MS = 20_000;

/**
 * Runs GPS tracking while the rep's day is open, and keeps the tracking queue
 * (day start / points / day end) draining whenever there's a connection.
 * Renders nothing.
 */
export function RepDayTracker() {
  const { running } = useRepDay();
  const { connected } = useNetworkStatus();

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    startTracking().then((result) => {
      if (cancelled || result === "ok") return;
      toast.error(
        result === "denied"
          ? "اسمح للتطبيق بالوصول إلى الموقع حتى تتمكن الشركة من متابعة يومك"
          : "تعذّر تشغيل تحديد الموقع",
      );
    });
    return () => {
      cancelled = true;
      void stopTracking();
    };
  }, [running]);

  useEffect(() => {
    if (!connected) return;
    void flushTrackingQueue();
    const interval = setInterval(() => void flushTrackingQueue(), RETRY_INTERVAL_MS);
    const resume = App.addListener("appStateChange", (state) => {
      if (state.isActive) void flushTrackingQueue();
    }).catch(() => null);
    return () => {
      clearInterval(interval);
      void resume.then((h) => h?.remove());
    };
  }, [connected]);

  return null;
}

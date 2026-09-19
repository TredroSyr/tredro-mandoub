"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { flushOutbox } from "@/lib/sync/flush-outbox";

/**
 * Fires the outbox flush the moment connectivity returns, and once more on
 * mount in case the app was launched already online with items left over
 * from a previous offline session. Invisible — renders nothing.
 */
export function SyncOnReconnect() {
  const { connected } = useNetworkStatus();
  const wasConnected = useRef(connected);
  const queryClient = useQueryClient();

  useEffect(() => {
    const justReconnected = connected && !wasConnected.current;
    wasConnected.current = connected;
    if (!connected) return;

    flushOutbox().then(() => {
      // A flush happens outside any component's mutation lifecycle, so the
      // normal invalidate-on-success paths inside each mutation hook never
      // run for a replayed item — nudge the lists an offline session is
      // most likely to have touched instead of a broad refetch-everything.
      if (justReconnected) {
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    });
  }, [connected, queryClient]);

  return null;
}

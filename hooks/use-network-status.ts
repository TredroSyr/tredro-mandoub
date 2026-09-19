"use client";

import { useEffect, useState } from "react";
import { Network, type ConnectionStatus } from "@capacitor/network";

const DEFAULT_STATUS: ConnectionStatus = {
  connected: true,
  connectionType: "unknown",
};

/**
 * Wraps @capacitor/network so the rest of the app (the offline banner, and
 * later the sync-on-reconnect trigger) reacts to connectivity without every
 * caller touching the plugin directly. Starts "connected" until the first
 * native status resolves, so a slow bridge on cold start never flashes a
 * false offline state.
 */
export function useNetworkStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(DEFAULT_STATUS);

  useEffect(() => {
    let cancelled = false;

    Network.getStatus().then((current) => {
      if (!cancelled) setStatus(current);
    });

    const listenerPromise = Network.addListener(
      "networkStatusChange",
      (current) => setStatus(current),
    );

    return () => {
      cancelled = true;
      listenerPromise.then((listener) => listener.remove());
    };
  }, []);

  return status;
}

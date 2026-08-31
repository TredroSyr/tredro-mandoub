"use client";

import axios from "axios";
import { useEffect } from "react";

// Diagnostic only — deliberately does NOT touch our own backend.
// Pings a third-party, always-on API every 30s to prove the WebView's own
// networking stack (DNS/TLS/etc.) is warm and fine. If real cold-launch
// requests to our backend are still slow/failing while this control ping is
// consistently fast, that rules out a generic "WebView cold start" cause and
// points at the backend itself (Render free-plan spin-down).
// Remove once the hypothesis is confirmed.
const PING_INTERVAL_MS = 30000;
const CONTROL_URLS = {
  jsonplaceholder: "https://jsonplaceholder.typicode.com/todos/1",
  // Same OSRM demo server the map/routing feature actually calls in
  // module/map/lib/routing.ts — a more meaningful baseline than an arbitrary
  // third-party API since it's real infra this app already depends on.
  osrm: "https://router.project-osrm.org/route/v1/driving/13.388860,52.517037;13.397634,52.529407?overview=false",
  // A different backend of ours, not on Render — another real-infra data
  // point to compare against tredro-backend's cold-launch behavior.
  authBackend: "https://back-auth.kadnya-dev.com/health",
};

export default function NetworkControlPing() {
  useEffect(() => {
    const ping = (label: string, url: string) => {
      const start = Date.now();
      axios
        .get(url, { timeout: 20000 })
        .then(() => {
          console.log(`[control-ping:${label}] ok in ${Date.now() - start}ms`);
        })
        .catch((error) => {
          console.log(
            `[control-ping:${label}] failed after ${Date.now() - start}ms:`,
            error?.response?.status ?? error?.message,
          );
        });
    };

    const pingAll = () => {
      Object.entries(CONTROL_URLS).forEach(([label, url]) => ping(label, url));
    };

    pingAll();
    const id = setInterval(pingAll, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}

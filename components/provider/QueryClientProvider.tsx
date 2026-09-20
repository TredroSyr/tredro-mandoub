"use client";

import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Network } from "@capacitor/network";
import { useState } from "react";
import { isNativeApp } from "@/lib/native";
import { sqlitePersister } from "@/lib/db/query-persister";

// Cached reads older than this are discarded on restore rather than shown
// as if current — a rep opening the app after a week away should see a
// fresh pull, not a week-old customer list with no indication it's stale.
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

let onlineManagerWired = false;

/**
 * React Query's default online detection only reacts to browser online/
 * offline *events* and assumes "online" at startup, so a cold start with no
 * connection is treated as online. Drive it from the Capacitor Network
 * plugin instead, which reports the real state from the first moment.
 */
function wireOnlineManagerToCapacitor() {
  if (onlineManagerWired) return;
  onlineManagerWired = true;

  onlineManager.setEventListener((setOnline) => {
    Network.getStatus()
      .then((status) => setOnline(status.connected))
      .catch(() => {});
    const handle = Network.addListener("networkStatusChange", (status) =>
      setOnline(status.connected),
    );
    return () => {
      handle.then((h) => h.remove()).catch(() => {});
    };
  });
}

function createQueryClient(native: boolean) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Native app only. "offlineFirst": always try the cache/first
        // request, and when a retry would need the network while offline,
        // PAUSE instead of failing — so restored data stays on screen with
        // no error state. (Web keeps React Query's default.)
        ...(native ? { networkMode: "offlineFirst" as const } : {}),
        // Retry failed requests up to 2 times (not infinitely)
        retry: 1,
        // Exponential backoff, capped at 30s
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch just because the window regained focus
        refetchOnWindowFocus: false,
        // Don't refetch on every mount if data is still fresh
        refetchOnMount: false,
        // Data considered fresh for 1 minute (no auto refetch/scaling)
        staleTime: 60 * 1000,
        // Native: must be >= MAX_CACHE_AGE_MS — TanStack's persistence
        // guidance warns a shorter gcTime garbage-collects a restored query
        // from memory before it's ever shown. Web keeps the old 5 minutes.
        gcTime: native ? MAX_CACHE_AGE_MS : 5 * 60 * 1000,
      },
      mutations: {
        // Native app only. "always": run mutationFn even with no
        // connection. The default ("online") silently PAUSES the mutation
        // while offline, so the offline outbox in each mutation hook would
        // never get a chance to capture the write.
        ...(native ? { networkMode: "always" as const } : {}),
        // Mutations usually shouldn't auto-retry (side effects)
        retry: 0,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [native] = useState(() => isNativeApp());
  const [queryClient] = useState(() => {
    if (native) wireOnlineManagerToCapacitor();
    return createQueryClient(native);
  });

  if (!native) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    // PersistQueryClientProvider (not a bare persistQueryClient() call) holds
    // every query back until the cache is restored — otherwise queries start
    // fetching first, fail offline, and flip to an error state that hides
    // the very data that was just restored.
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: sqlitePersister, maxAge: MAX_CACHE_AGE_MS }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

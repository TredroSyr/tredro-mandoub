"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { useEffect, useState } from "react";
import { sqlitePersister } from "@/lib/db/query-persister";

// Cached reads older than this are discarded on restore rather than shown
// as if current — a rep opening the app after a week away should see a
// fresh pull, not a week-old customer list with no indication it's stale.
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
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
            // Must be >= MAX_CACHE_AGE_MS below: TanStack's own persistence
            // guidance warns that a shorter gcTime garbage-collects a
            // restored query from memory before it's ever shown, even
            // though the underlying persisted row is still there.
            gcTime: MAX_CACHE_AGE_MS,
          },
          mutations: {
            // Mutations usually shouldn't auto-retry (side effects)
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister: sqlitePersister,
      maxAge: MAX_CACHE_AGE_MS,
    });
    return unsubscribe;
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

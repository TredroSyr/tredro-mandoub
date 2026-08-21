"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
            // Keep unused cache around for 5 minutes before garbage collection
            gcTime: 5 * 60 * 1000,
          },
          mutations: {
            // Mutations usually shouldn't auto-retry (side effects)
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

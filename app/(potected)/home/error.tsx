"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/tredro/error-state";

/** Next.js route-level error boundary for the Home Page — catches unexpected render/runtime crashes. */
export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState error={error} onRetry={reset} />;
}

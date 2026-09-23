"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import type { FetchStatus } from "@tanstack/react-query";

/** Tracks browser connectivity so error states can distinguish "no internet" from a real server error. */
export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const setOffline = () => setIsOffline(true);
    const setOnline = () => setIsOffline(false);
    window.addEventListener("offline", setOffline);
    window.addEventListener("online", setOnline);
    return () => {
      window.removeEventListener("offline", setOffline);
      window.removeEventListener("online", setOnline);
    };
  }, []);

  return isOffline;
}

/** A request that never reached the server (no response) is treated as a connectivity issue, not a server error. */
export function isNetworkError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (isAxiosError(error)) return !error.response;
  return false;
}

export interface QueryLikeResult {
  isError: boolean;
  data: unknown;
  fetchStatus: FetchStatus;
}

/**
 * Whether a query result should render ErrorState instead of falling through
 * to an empty/list view: either a real failure with nothing cached, or —
 * under offlineFirst — the fetch never ran because the device is offline and
 * has never downloaded this data before (fetchStatus "paused").
 */
export function needsErrorState({ isError, data, fetchStatus }: QueryLikeResult) {
  return data === undefined && (isError || fetchStatus === "paused");
}

"use client";

import { useCallback, useRef, useState } from "react";

import { Shop } from "./tour-data";
import { fetchOptimizedTrip, TripResult } from "./routing";
import {
  getCurrentPosition,
  GeoInsecureContextError,
  GeoPermissionError,
} from "./geo";

export type RoutePlanState = "idle" | "loading" | "ready" | "error";

/**
 * Owns the "Determine Route" multi-stop planning flow: one-shot geolocation
 * fetch + OSRM Trip optimization. Deliberately independent of
 * `useTourNavigation` (continuous single-shop turn-by-turn is a different
 * concept) — mutual exclusivity between the two is enforced by the page.
 */
export function useRoutePlan() {
  const [state, setState] = useState<RoutePlanState>("idle");
  const [trip, setTrip] = useState<TripResult | null>(null);
  const [geoError, setGeoError] = useState<"denied" | "insecure" | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const geoErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashGeoError = useCallback((reason: "denied" | "insecure") => {
    setGeoError(reason);
    if (geoErrorTimer.current) clearTimeout(geoErrorTimer.current);
    geoErrorTimer.current = setTimeout(() => setGeoError(null), 5000);
  }, []);

  const planRoute = useCallback(
    async (shops: Shop[]) => {
      if (shops.length === 0) return;
      setGeoError(null);
      setState("loading");
      try {
        const origin = await getCurrentPosition();
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        const result = await fetchOptimizedTrip(origin, shops, ac.signal);
        setTrip(result);
        setState("ready");
      } catch (err) {
        if (err instanceof GeoInsecureContextError) {
          flashGeoError("insecure");
          setState("idle");
        } else if (err instanceof GeoPermissionError) {
          flashGeoError("denied");
          setState("idle");
        } else if ((err as Error)?.name !== "AbortError") {
          setState("error");
        }
      }
    },
    [flashGeoError],
  );

  const clearPlan = useCallback(() => {
    abortRef.current?.abort();
    setTrip(null);
    setState("idle");
  }, []);

  const dismissGeoError = useCallback(() => {
    if (geoErrorTimer.current) clearTimeout(geoErrorTimer.current);
    setGeoError(null);
  }, []);

  return { state, trip, geoError, planRoute, clearPlan, dismissGeoError };
}

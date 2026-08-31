"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ALEPPO_CENTER, Shop, distanceKm } from "./tour-data";
import {
  fetchRoute,
  RouteResult,
  bearing as bearingBetween,
} from "./routing";
import {
  clearWatch,
  GeoWatchId,
  getCurrentPosition,
  watchPosition,
  GeoInsecureContextError,
} from "./geo";

export type LocationState = "off" | "live" | "denied" | "insecure";

/**
 * Owns "where is the rep, and how do we get them to the selected shop":
 * geolocation (one-shot + continuous tracking while navigating), route
 * fetching, and the follow-camera bearing/heading calculation. `flyTo`
 * is injected so this hook stays decoupled from the map's own focus state.
 */
export function useTourNavigation({
  flyTo,
}: {
  flyTo: (center: [number, number], zoom?: number) => void;
}) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locState, setLocState] = useState<LocationState>("off");
  const [locMsgVisible, setLocMsgVisible] = useState(false);
  const [navShop, setNavShop] = useState<Shop | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [heading, setHeading] = useState(0);
  const [follow, setFollow] = useState(true);

  const watchId = useRef<GeoWatchId | null>(null);
  const locMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFollowFlyAt = useRef(0);

  const origin = userPos ?? ALEPPO_CENTER;

  const flashLocationError = useCallback((state: "denied" | "insecure") => {
    setLocState(state);
    setLocMsgVisible(true);
    if (locMsgTimer.current) clearTimeout(locMsgTimer.current);
    locMsgTimer.current = setTimeout(() => setLocMsgVisible(false), 5000);
  }, []);

  const handleGeoError = useCallback(
    (err: unknown) => {
      flashLocationError(
        err instanceof GeoInsecureContextError ? "insecure" : "denied",
      );
    },
    [flashLocationError],
  );

  const reportPosition = useCallback((pos: [number, number]) => {
    setUserPos(pos);
    setLocState("live");
  }, []);

  const locate = useCallback(() => {
    getCurrentPosition()
      .then((pos) => {
        reportPosition(pos);
        flyTo(pos, 15);
      })
      .catch(handleGeoError);
  }, [reportPosition, flyTo, handleGeoError]);

  const startNavigation = useCallback(
    (shop: Shop) => {
      setNavShop(shop);
      setFollow(true);
      if (!userPos) locate();
      flyTo([shop.lat, shop.lng], 17);
    },
    [userPos, locate, flyTo],
  );

  const stopNavigation = useCallback(() => setNavShop(null), []);

  const centerOnUser = useCallback(() => {
    setFollow(true);
    if (userPos) flyTo(userPos, 17);
    else locate();
  }, [userPos, flyTo, locate]);

  const handleBearingChange = useCallback(
    (deg: number) => {
      setBearing(deg);
      if (navShop && Math.abs(deg - heading) > 8) setFollow(false);
    },
    [navShop, heading],
  );

  // Continuous GPS tracking while a navigation is active.
  useEffect(() => {
    if (!navShop) return;
    let cancelled = false;
    watchPosition(
      (pos, headingDeg) => {
        if (cancelled) return;
        setUserPos(pos);
        setLocState("live");
        if (headingDeg !== null) setHeading(headingDeg);
      },
      (reason) => {
        if (cancelled) return;
        flashLocationError(reason === "insecure" ? "insecure" : "denied");
      },
    ).then((id) => {
      if (cancelled) clearWatch(id);
      else watchId.current = id;
    });
    return () => {
      cancelled = true;
      if (watchId.current) clearWatch(watchId.current);
      watchId.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navShop]);

  // Fetch a road-accurate route whenever the destination or origin changes.
  useEffect(() => {
    if (!navShop) {
      setRoute(null);
      setRouteError(false);
      return;
    }
    const ac = new AbortController();
    setRouteLoading(true);
    setRouteError(false);
    fetchRoute(origin, [navShop.lat, navShop.lng], ac.signal)
      .then((r) => {
        setRoute(r);
        setRouteError(false);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setRouteError(true);
      })
      .finally(() => setRouteLoading(false));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navShop, origin[0].toFixed(3), origin[1].toFixed(3)]);

  // While following, keep the camera centered on the rep and facing the road ahead.
  useEffect(() => {
    if (!navShop || !follow || !userPos) return;
    const now = Date.now();
    if (now - lastFollowFlyAt.current < 700) return;
    lastFollowFlyAt.current = now;

    const pts = route?.coords ?? [[navShop.lat, navShop.lng] as [number, number]];
    const ahead =
      pts.find((c) => distanceKm(userPos, c) > 0.04) ??
      pts[pts.length - 1] ??
      userPos;
    const b = bearingBetween(userPos, ahead);
    setHeading(b);
    setBearing(b);
    flyTo(userPos, 17);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navShop, follow, userPos, route]);

  const remaining = useMemo(() => {
    if (!navShop) return null;
    if (route) return { dist: route.distance, dur: route.duration };
    const km = distanceKm(origin, [navShop.lat, navShop.lng]);
    return { dist: km * 1000, dur: km * 180 };
  }, [navShop, route, origin]);

  return {
    userPos,
    locState,
    locMsgVisible,
    setLocMsgVisible,
    origin,
    navShop,
    route,
    routeLoading,
    routeError,
    remaining,
    bearing,
    heading,
    follow,
    locate,
    reportPosition,
    handleGeoError,
    startNavigation,
    stopNavigation,
    centerOnUser,
    handleBearingChange,
  };
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Polyline } from "leaflet";

import { PRIMARY } from "./markers";
import { closestIndexOnRoute } from "./markers";

/** Trims the route to the driver's current position while navigating, and draws it as a two-layer polyline (casing + line). */
export function useMapRoute({
  mapRef,
  leafletRef,
  mapReady,
  route,
  userPos,
  navMode,
}: {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  leafletRef: React.MutableRefObject<typeof import("leaflet") | null>;
  mapReady: boolean;
  route: [number, number][] | null;
  userPos: [number, number] | null;
  navMode: boolean;
}) {
  const routeRef = useRef<{ casing: Polyline; line: Polyline } | null>(null);
  const [displayRoute, setDisplayRoute] = useState<[number, number][] | null>(
    route,
  );

  useEffect(() => {
    if (!navMode || !userPos || !route || route.length < 2) {
      setDisplayRoute(route);
      return;
    }
    const index = closestIndexOnRoute(userPos, route);
    const trimmed = route.slice(Math.max(0, index - 1));
    setDisplayRoute(trimmed.length >= 2 ? trimmed : route);
  }, [route, userPos, navMode]);

  useEffect(() => {
    if (!mapReady) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!displayRoute || displayRoute.length < 2) {
      routeRef.current?.casing.remove();
      routeRef.current?.line.remove();
      routeRef.current = null;
      return;
    }

    if (routeRef.current) {
      routeRef.current.casing.setLatLngs(displayRoute);
      routeRef.current.line.setLatLngs(displayRoute);
      return;
    }

    const renderer = L.canvas({ padding: 0.6 });

    const casing = L.polyline(displayRoute, {
      renderer,
      color: "var(--card)",
      weight: 12,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    const line = L.polyline(displayRoute, {
      renderer,
      color: PRIMARY,
      weight: 7,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
      className: "route-line",
    }).addTo(map);

    routeRef.current = { casing, line };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayRoute, mapReady]);
}

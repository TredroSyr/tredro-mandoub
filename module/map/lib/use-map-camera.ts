"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

type Focus = {
  center: [number, number];
  zoom?: number;
  nonce: number;
} | null;

/** Handles viewport concerns: rotation lock while navigating, bearing sync, fly-to focus requests, and auto-fitting the route on first draw. */
export function useMapCamera({
  mapRef,
  leafletRef,
  navMode,
  bearing,
  focus,
  route,
  routePlanCoords,
  bottomInset,
}: {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  leafletRef: React.MutableRefObject<typeof import("leaflet") | null>;
  navMode: boolean;
  bearing: number;
  focus: Focus;
  route: [number, number][] | null;
  routePlanCoords?: [number, number][] | null;
  bottomInset: number;
}) {
  const lastRouteKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const map = mapRef.current as any;
    if (!map) return;
    if (navMode) {
      map.touchRotate?.disable?.();
    } else {
      map.touchRotate?.enable?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navMode]);

  useEffect(() => {
    const map = mapRef.current as
      | (LeafletMap & {
          setBearing?: (bearing: number) => void;
          getBearing?: () => number;
        })
      | null;
    if (!map?.setBearing) return;
    const current = map.getBearing?.() ?? 0;
    if (Math.abs(current - bearing) > 1) {
      map.setBearing(bearing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bearing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;

    const targetZoom = focus.zoom ?? map.getZoom();
    const targetCenter = focus.center;
    const currentCenter = map.getCenter();
    const distance = map.distance(currentCenter, targetCenter);

    if (navMode) {
      if (distance < 40 && Math.abs(map.getZoom() - targetZoom) < 0.1) return;
      map.setView(targetCenter, targetZoom, { animate: false });
      return;
    }

    map.flyTo(targetCenter, targetZoom, { duration: 0.5, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || navMode) return;

    const boundsSource = route ?? routePlanCoords;
    if (!boundsSource || boundsSource.length < 2) return;

    const routeKey = [
      boundsSource.length,
      boundsSource[0]?.join(","),
      boundsSource[boundsSource.length - 1]?.join(","),
    ].join(":");
    if (lastRouteKeyRef.current === routeKey) return;
    lastRouteKeyRef.current = routeKey;

    const bounds = L.latLngBounds(boundsSource);
    map.fitBounds(bounds, {
      paddingTopLeft: [40, 120],
      paddingBottomRight: [40, bottomInset + 60],
      animate: false,
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, routePlanCoords, navMode]);
}

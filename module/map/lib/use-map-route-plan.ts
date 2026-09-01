"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

import { resolveThemeColor, stopBadgeSvg } from "./markers";
import { TripResult } from "./routing";

/** Draws the "Determine Route" plan (multi-stop polyline + numbered stop badges) as a
 * layer independent from the single-shop nav route in `use-map-route.ts`, so the two
 * never fight over the same refs/instances. */
export function useMapRoutePlan({
  mapRef,
  leafletRef,
  mapReady,
  trip,
}: {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  leafletRef: React.MutableRefObject<typeof import("leaflet") | null>;
  mapReady: boolean;
  trip: TripResult | null;
}) {
  const routeRef = useRef<{ casing: Polyline; line: Polyline } | null>(null);
  const stopMarkersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!mapReady) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    routeRef.current?.casing.remove();
    routeRef.current?.line.remove();
    routeRef.current = null;
    stopMarkersRef.current.forEach((marker) => marker.remove());
    stopMarkersRef.current = [];

    if (!trip || trip.coords.length < 2) return;

    const renderer = L.canvas({ padding: 0.6 });
    const casingColor = resolveThemeColor("--card", "#ffffff");
    const lineColor = resolveThemeColor("--primary", "#2563eb");

    const casing = L.polyline(trip.coords, {
      renderer,
      color: casingColor,
      weight: 10,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    const line = L.polyline(trip.coords, {
      renderer,
      color: lineColor,
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      className: "route-plan-line",
    }).addTo(map);

    routeRef.current = { casing, line };

    trip.stops.forEach((stop, i) => {
      const icon = L.divIcon({
        html: stopBadgeSvg(i + 1),
        className: "",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([stop.shop.lat, stop.shop.lng], {
        icon,
        zIndexOffset: 1200,
      }).addTo(map);
      stopMarkersRef.current.push(marker);
    });

    return () => {
      routeRef.current?.casing.remove();
      routeRef.current?.line.remove();
      routeRef.current = null;
      stopMarkersRef.current.forEach((marker) => marker.remove());
      stopMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, mapReady]);
}

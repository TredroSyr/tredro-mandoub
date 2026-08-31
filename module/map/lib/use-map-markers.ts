"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

import { Shop } from "./tour-data";
import { storeSvg, truckSvg, flagSvg } from "./markers";

type MarkerCallbacks = {
  onSelect: (id: string) => void;
};

/** Renders shop pins, the live user (truck) marker, and the location-picking flag. */
export function useMapMarkers({
  mapRef,
  leafletRef,
  mapReady,
  shops,
  selectedId,
  callbacksRef,
  userPos,
  heading,
  bearing,
  pickedPoint,
}: {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  leafletRef: React.MutableRefObject<typeof import("leaflet") | null>;
  mapReady: boolean;
  shops: Shop[];
  selectedId: string | null;
  callbacksRef: React.MutableRefObject<MarkerCallbacks>;
  userPos: [number, number] | null;
  heading: number;
  bearing: number;
  pickedPoint: [number, number] | null;
}) {
  const markersRef = useRef<Record<string, Marker>>({});
  const userMarkerRef = useRef<Marker | null>(null);
  const pickMarkerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!mapReady) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const validIds = new Set(shops.map((shop) => shop.id));
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!validIds.has(id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    shops.forEach((shop) => {
      // Skip shops with invalid coordinates
      if (shop.lat == null || shop.lng == null) return;

      const active = shop.id === selectedId;
      const size: [number, number] = active ? [42, 51] : [31, 38];
      const icon = L.divIcon({
        html: storeSvg(active),
        className: "",
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]],
      });

      const existing = markersRef.current[shop.id];
      if (existing) {
        existing.setLatLng([shop.lat, shop.lng]);
        existing.setIcon(icon);
        existing.setZIndexOffset(active ? 1000 : 0);
      } else {
        const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(map);
        marker.on("click", () => callbacksRef.current.onSelect(shop.id));
        markersRef.current[shop.id] = marker;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops, selectedId, mapReady]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!userPos) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    const icon = L.divIcon({
      html: truckSvg(heading - bearing),
      className: "",
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPos).setIcon(icon);
    } else {
      userMarkerRef.current = L.marker(userPos, {
        icon,
        zIndexOffset: 1500,
      }).addTo(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, heading, bearing]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!pickedPoint) {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
      return;
    }

    const icon = L.divIcon({
      html: flagSvg,
      className: "",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (pickMarkerRef.current) {
      pickMarkerRef.current.setLatLng(pickedPoint);
    } else {
      pickMarkerRef.current = L.marker(pickedPoint, {
        icon,
        zIndexOffset: 900,
      }).addTo(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedPoint]);
}

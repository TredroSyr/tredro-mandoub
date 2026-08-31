"use client";

import { useEffect, useRef } from "react";
import { useMapInstance } from "@/module/map/lib/use-map-instance";
import { useMapMarkers } from "@/module/map/lib/use-map-markers";

export interface LocationPickerMapProps {
  point: [number, number];
  onPick: (lat: number, lng: number) => void;
}

/** A single-marker Leaflet picker: tap anywhere to move the flag. Reuses the map/marker plumbing built for the full tour map. */
export function LocationPickerMap({ point, onPick }: LocationPickerMapProps) {
  const callbacksRef = useRef({
    onSelect: () => {},
    onPick,
    picking: true,
    onBearingChange: () => {},
  });
  callbacksRef.current.onPick = onPick;

  const { containerRef, mapRef, leafletRef, mapReady, tilesReady } = useMapInstance({
    callbacksRef,
    picking: true,
    overlayOpen: false,
    bottomInset: 0,
  });

  useMapMarkers({
    mapRef,
    leafletRef,
    mapReady,
    shops: [],
    selectedId: null,
    callbacksRef,
    userPos: null,
    heading: 0,
    bearing: 0,
    pickedPoint: point,
  });

  useEffect(() => {
    if (mapReady) mapRef.current?.setView(point, 17);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl">
      <div ref={containerRef} className="map-surface absolute inset-0 h-full w-full" />
      {!tilesReady && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef } from "react";

import { Shop } from "../lib/tour-data";
import { useMapInstance } from "../lib/use-map-instance";
import { useMapMarkers } from "../lib/use-map-markers";
import { useMapRoute } from "../lib/use-map-route";
import { useMapCamera } from "../lib/use-map-camera";

type Props = {
  shops: Shop[];
  selectedId: string | null;
  onSelect: (id: string) => void;

  picking: boolean;
  onPick: (lat: number, lng: number) => void;

  pickedPoint: [number, number] | null;

  userPos: [number, number] | null;

  focus: {
    center: [number, number];
    zoom?: number;
    nonce: number;
  } | null;

  bottomInset: number;

  route: [number, number][] | null;

  bearing: number;
  onBearingChange: (deg: number) => void;

  heading: number;

  navMode: boolean;

  overlayOpen: boolean;
};

export function TourMap({
  shops,
  selectedId,
  onSelect,
  picking,
  onPick,
  pickedPoint,
  userPos,
  focus,
  bottomInset,
  route,
  bearing,
  onBearingChange,
  heading,
  navMode,
  overlayOpen,
}: Props) {
  const callbacksRef = useRef({ onSelect, onPick, picking, onBearingChange });
  callbacksRef.current = { onSelect, onPick, picking, onBearingChange };

  const { containerRef, mapRef, leafletRef, mapReady, tilesReady } =
    useMapInstance({ callbacksRef, picking, overlayOpen, bottomInset });

  useMapMarkers({
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
  });

  useMapRoute({ mapRef, leafletRef, mapReady, route, userPos, navMode });

  useMapCamera({
    mapRef,
    leafletRef,
    navMode,
    bearing,
    focus,
    route,
    bottomInset,
  });

  return (
    <div className="absolute inset-0 h-full w-full">
      <div
        ref={containerRef}
        className="map-surface absolute inset-0 h-full w-full"
      />

      {!tilesReady && (
        <div
          className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3"
          style={{ background: "var(--background)" }}
        >
          <div
            className="h-9 w-9 animate-spin rounded-full border-4"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--primary)",
            }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            جاري تحميل الخريطة...
          </span>
        </div>
      )}
    </div>
  );
}

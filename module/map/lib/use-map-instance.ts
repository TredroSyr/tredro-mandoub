"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

import { ALEPPO_CENTER } from "./tour-data";

type MapCallbacks = {
  onSelect: (id: string) => void;
  onPick: (lat: number, lng: number) => void;
  picking: boolean;
  onBearingChange: (deg: number) => void;
};

/**
 * Owns the Leaflet map + tile layer lifecycle: creation, teardown, resize
 * handling, and the tile redraw needed when overlays cover/uncover the map.
 * `mapReady` flips once the map instance exists, so marker/route/camera
 * hooks can key their initial paint off it instead of an imperative call.
 */
export function useMapInstance({
  callbacksRef,
  picking,
  overlayOpen,
  bottomInset,
}: {
  callbacksRef: React.MutableRefObject<MapCallbacks>;
  picking: boolean;
  overlayOpen: boolean;
  bottomInset: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const tileLayerRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

    const initialize = async () => {
      try {
        const leafletModule = await import("leaflet");
        await import("leaflet-rotate");
        const L = leafletModule.default;

        if (cancelled || !containerRef.current || mapRef.current) return;
        leafletRef.current = L;

        const map = L.map(containerRef.current, {
          center: ALEPPO_CENTER,
          zoom: 13,
          zoomControl: false,
          attributionControl: true,
          preferCanvas: true,
          zoomAnimation: false,
          markerZoomAnimation: false,
          fadeAnimation: false,
          inertia: true,
          zoomSnap: 0.5,
          zoomDelta: 0.5,
          wheelPxPerZoomLevel: 90,
          bounceAtZoomLimits: false,
          rotate: true,
          bearing: 0,
          rotateControl: false,
          touchRotate: true,
          shiftKeyRotate: true,
        } as any);

        const tileLayer = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            subdomains: "abc",
            attribution: "© OpenStreetMap contributors",
            keepBuffer: 4,
            updateWhenIdle: false,
            updateWhenZooming: true,
            crossOrigin: false,
            detectRetina: false,
            className: "tile-layer",
          },
        );

        tileLayerRef.current = tileLayer;

        tileLayer.on("load", () => {
          if (!cancelled) setTilesReady(true);
        });

        tileLayer.on("tileerror", () => {});

        tileLayer.addTo(map);

        map.on("click", (event: any) => {
          if (callbacksRef.current.picking) {
            callbacksRef.current.onPick(event.latlng.lat, event.latlng.lng);
          }
        });

        map.on("rotate", () => {
          const value = (map as any).getBearing?.() ?? 0;
          callbacksRef.current.onBearingChange(value);
        });

        mapRef.current = map;
        setMapReady(true);

        requestAnimationFrame(() => {
          if (!cancelled && mapRef.current) {
            mapRef.current.invalidateSize({
              animate: false,
              pan: false,
            } as any);
          }
        });

        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
          const observer = new ResizeObserver(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize({
                animate: false,
                pan: false,
              } as any);
            }
          });
          observer.observe(containerRef.current);
          resizeObserverRef.current = observer;
        }

        loadingTimeout = setTimeout(() => {
          if (!cancelled) setTilesReady(true);
        }, 5000);
      } catch (error) {
        console.error("[TourMap] init failed:", error);
        if (!cancelled) setTilesReady(true);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      tileLayerRef.current?.off();
      tileLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force tile layer refresh when picking mode changes
  useEffect(() => {
    const tileLayer = tileLayerRef.current;
    if (tileLayer && mapReady) {
      tileLayer.redraw?.();
    }
  }, [picking, overlayOpen, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const invalidate = () => {
      map.invalidateSize({ animate: false, pan: false } as any);
    };

    invalidate();

    const timers = [50, 100, 200, 400, 600, 800].map((delay) =>
      setTimeout(invalidate, delay),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [picking, overlayOpen, bottomInset]);

  return {
    containerRef,
    mapRef,
    leafletRef,
    tileLayerRef,
    mapReady,
    tilesReady,
  };
}

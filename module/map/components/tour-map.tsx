"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

import { ALEPPO_CENTER, Shop } from "../lib/tour-data";

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

const PRIMARY = "var(--primary)";
const PRIMARY_SOFT = "var(--primary) / 0.35";
const PRIMARY_SHADOW = "var(--primary) / 0.45";

const storeSvg = (active: boolean) => {
  const s = active ? 1.1 : 0.82;

  return `
    <div class="marker-pin" style="width:${38 * s}px;height:${46 * s}px;">
      <svg width="${38 * s}" height="${46 * s}" viewBox="0 0 38 46" fill="none">
        <path
          d="M19 45C19 45 36 27.5 36 17.6C36 8.4 28.4 1 19 1C9.6 1 2 8.4 2 17.6C2 27.5 19 45 19 45Z"
          style="fill:${PRIMARY}"
          stroke="var(--card)"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
        <g transform="translate(9.5 9)" stroke="var(--card)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M0.6 4.2 2.2 0.8h14.6l1.6 3.4"/>
          <path d="M0.6 4.2c0 1.6 1.2 2.7 2.7 2.7S6 5.8 6 4.2c0 1.6 1.2 2.7 2.7 2.7s2.7-1.1 2.7-2.7c0 1.6 1.2 2.7 2.7 2.7s2.7-1.1 2.7-2.7"/>
          <path d="M2.3 7v9.4h14.4V7" />
          <path d="M7 16.4v-5h5v5" />
        </g>
      </svg>
    </div>
  `;
};

const truckSvg = (rotation: number) => {
  return `
    <div class="user-dot" style="position:relative;width:42px;height:42px;transform:rotate(${rotation}deg);">
      <span style="position:absolute;inset:7px;border-radius:9999px;background:${PRIMARY_SOFT};display:block;"></span>
      <span style="position:absolute;inset:7px;border-radius:9999px;background:${PRIMARY};border:3px solid var(--card);box-shadow:0 6px 14px ${PRIMARY_SHADOW};display:grid;place-items:center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--card)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(-90deg)">
          <path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2" />
          <path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      </span>
    </div>
  `;
};

const flagSvg = `
  <div class="marker-pin" style="width:44px;height:44px;">
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="12" style="fill:${PRIMARY}" stroke="var(--card)" stroke-width="3" />
      <circle cx="22" cy="22" r="4" fill="var(--card)" />
    </svg>
  </div>
`;

function closestIndexOnRoute(
  point: [number, number],
  route: [number, number][],
): number {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < route.length; i++) {
    const distance = Math.hypot(route[i][0] - point[0], route[i][1] - point[1]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export default function TourMap({
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const userMarkerRef = useRef<Marker | null>(null);
  const pickMarkerRef = useRef<Marker | null>(null);
  const routeRef = useRef<{ casing: Polyline; line: Polyline } | null>(null);
  const tileLayerRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const lastRouteKeyRef = useRef<string | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const callbacksRef = useRef({ onSelect, onPick, picking, onBearingChange });
  callbacksRef.current = { onSelect, onPick, picking, onBearingChange };

  const [displayRoute, setDisplayRoute] = useState<[number, number][] | null>(
    route,
  );
  const [tilesReady, setTilesReady] = useState(false);

  useEffect(() => {
    if (!navMode || !userPos || !route || route.length < 2) {
      setDisplayRoute(route);
      return;
    }
    const index = closestIndexOnRoute(userPos, route);
    const trimmed = route.slice(Math.max(0, index - 1));
    setDisplayRoute(trimmed.length >= 2 ? trimmed : route);
  }, [route, userPos, navMode]);

  const renderMarkers = () => {
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
  };

  const renderRoute = () => {
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
  };

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
          "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png",
          {
            maxZoom: 20,
            subdomains: "abcd",
            attribution: "© OpenStreetMap · CARTO",
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
        initializedRef.current = true;

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

        renderMarkers();
        renderRoute();

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
      markersRef.current = {};
      userMarkerRef.current = null;
      pickMarkerRef.current = null;
      routeRef.current = null;
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops, selectedId]);

  useEffect(() => {
    if (!initializedRef.current) return;
    renderRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayRoute]);

  useEffect(() => {
    const map = mapRef.current as any;
    if (!map) return;
    if (navMode) {
      map.touchRotate?.disable?.();
    } else {
      map.touchRotate?.enable?.();
    }
  }, [navMode]);

  // Force tile layer refresh when picking mode changes
  useEffect(() => {
    const tileLayer = tileLayerRef.current;
    if (tileLayer && initializedRef.current) {
      tileLayer.redraw?.();
    }
  }, [picking, overlayOpen]);

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
  }, [pickedPoint]);

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
    if (!L || !map || !route || route.length < 2 || navMode) return;

    const routeKey = [
      route.length,
      route[0]?.join(","),
      route[route.length - 1]?.join(","),
    ].join(":");
    if (lastRouteKeyRef.current === routeKey) return;
    lastRouteKeyRef.current = routeKey;

    const bounds = L.latLngBounds(route);
    map.fitBounds(bounds, {
      paddingTopLeft: [40, 120],
      paddingBottomRight: [40, bottomInset + 60],
      animate: false,
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, navMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const invalidate = () => {
      map.invalidateSize({ animate: false, pan: false } as any);
    };

    // Initial invalidation
    invalidate();

    // Schedule multiple invalidations to handle layout transitions
    const timers = [50, 100, 200, 400, 600, 800].map((delay) =>
      setTimeout(invalidate, delay)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [picking, overlayOpen, bottomInset]);

  return (
    <div className="absolute inset-0 h-full w-full">
      <div
        ref={containerRef}
        className={`map-surface absolute inset-0 h-full w-full ${
          picking ? "" : ""
        }`}
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

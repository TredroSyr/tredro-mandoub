"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

import { Shop } from "./tour-data";
import { shopMarkerHtml, truckSvg, flagSvg } from "./markers";
import { LABEL_MIN_SPACING_PX } from "./constants";

type MarkerCallbacks = {
  onSelect: (id: string) => void;
  onViewDetails: (customerId: number) => void;
};

/** Builds the popup body as a real detached DOM node (not an HTML string) so the
 * "View Details" button's click listener survives Leaflet re-parenting it into
 * `.leaflet-popup-content` on open/close, with no need to re-query on `popupopen`. */
function buildShopPopupContent(
  shop: Shop,
  onViewDetails: (customerId: number) => void,
): HTMLElement {
  const root = document.createElement("div");
  root.className = "shop-popup";

  const name = document.createElement("p");
  name.className = "shop-popup__name";
  name.textContent = shop.name;
  root.appendChild(name);

  if (shop.address) {
    const address = document.createElement("p");
    address.className = "shop-popup__meta";
    address.textContent = shop.address;
    root.appendChild(address);
  }

  if (shop.phone) {
    const phone = document.createElement("p");
    phone.className = "shop-popup__meta";
    phone.dir = "ltr";
    phone.textContent = shop.phone;
    root.appendChild(phone);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "shop-popup__button";
  button.textContent = "عرض التفاصيل";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onViewDetails(shop.customerId);
  });
  root.appendChild(button);

  return root;
}

/** Renders shop markers (a dot + always-attached name label, with a click popup), the live user (truck) marker, and the location-picking flag. */
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

  /** Density-aware label decluttering: an isolated marker always keeps its name
   * label, regardless of zoom. A marker whose label would land within
   * LABEL_MIN_SPACING_PX (screen px at the current zoom) of an already-accepted
   * label gets collapsed to just its dot instead. Zooming in spreads markers apart
   * in screen space, so more labels clear the threshold and reappear on their own
   * — no fixed zoom cutoff needed. Hovering a collapsed marker still reveals its
   * label, via the plain-CSS `.shop-marker:hover` rule (no JS needed for that part). */
  const recomputeLabelVisibility = (map: LeafletMap) => {
    const zoom = map.getZoom();
    const accepted: { x: number; y: number }[] = [];

    Object.values(markersRef.current).forEach((marker) => {
      const point = map.project(marker.getLatLng(), zoom);
      const collides = accepted.some(
        (p) => Math.hypot(p.x - point.x, p.y - point.y) < LABEL_MIN_SPACING_PX,
      );
      const visible = !collides;
      if (visible) accepted.push({ x: point.x, y: point.y });
      marker
        .getElement()
        ?.querySelector(".shop-marker")
        ?.classList.toggle("shop-marker--compact", !visible);
    });
  };

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
      const icon = L.divIcon({
        html: shopMarkerHtml(shop.name, active),
        className: "",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const existing = markersRef.current[shop.id];
      if (existing) {
        existing.setLatLng([shop.lat, shop.lng]);
        existing.setIcon(icon);
        existing.setZIndexOffset(active ? 1000 : 0);
      } else {
        const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(map);

        marker.bindPopup(
          buildShopPopupContent(shop, (customerId) =>
            callbacksRef.current.onViewDetails(customerId),
          ),
          { closeButton: true, autoPan: true, maxWidth: 240, className: "shop-popup-wrapper" },
        );

        marker.on("click", () => callbacksRef.current.onSelect(shop.id));

        markersRef.current[shop.id] = marker;
      }
    });

    recomputeLabelVisibility(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops, selectedId, mapReady]);

  // Re-run the collision pass whenever the zoom changes — markers spread apart in
  // screen space as you zoom in, so labels that were hidden for crowding can reappear.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !mapReady) return;

    const applyVisibility = () => recomputeLabelVisibility(map);
    map.on("zoomend", applyVisibility);
    return () => {
      map.off("zoomend", applyVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

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

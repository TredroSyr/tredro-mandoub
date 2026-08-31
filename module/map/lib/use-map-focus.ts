"use client";

import { useCallback, useRef, useState } from "react";

export type MapFocus = {
  center: [number, number];
  zoom?: number;
  nonce: number;
} | null;

/** Requests the map fly to a given center/zoom; each call is uniquely nonced so repeated flights to the same point still trigger. */
export function useMapFocus() {
  const [focus, setFocus] = useState<MapFocus>(null);
  const nonce = useRef(0);

  const flyTo = useCallback((center: [number, number], zoom = 16) => {
    setFocus({ center, zoom, nonce: ++nonce.current });
  }, []);

  return { focus, flyTo };
}

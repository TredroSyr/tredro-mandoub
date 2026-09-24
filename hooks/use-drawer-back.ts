"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

// Open drawers, most recently opened last. Back should close the top one
// instead of navigating away from the screen underneath.
const stack: { id: number; close: () => void }[] = [];
let nextId = 0;

/** Closes the top-most open drawer. Returns false when none is open. */
export function closeTopDrawer(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.close();
  return true;
}

/**
 * Makes the back gesture/button close the drawer while it is open.
 * Native: HardwareBackButton consults closeTopDrawer(). Web: a history entry
 * is pushed on open so the browser back button pops it and closes the drawer.
 */
export function useDrawerBack(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;

    const id = nextId++;
    const isNative = Capacitor.isNativePlatform();
    let poppedByUser = false;

    stack.push({ id, close: () => closeRef.current() });

    const onPopState = () => {
      poppedByUser = true;
      closeRef.current();
    };

    if (!isNative) {
      window.history.pushState({ ...window.history.state, drawer: id }, "");
      window.addEventListener("popstate", onPopState);
    }

    return () => {
      const index = stack.findIndex((entry) => entry.id === id);
      if (index !== -1) stack.splice(index, 1);

      if (!isNative) {
        window.removeEventListener("popstate", onPopState);
        // Closed by tap/swipe: drop the history entry we added.
        if (!poppedByUser && window.history.state?.drawer === id) {
          window.history.back();
        }
      }
    };
  }, [open]);
}

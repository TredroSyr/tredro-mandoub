"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the on-screen keyboard is open by tracking changes
 * in `window.visualViewport` height. Returns `false` on environments
 * without `visualViewport` support (falls back gracefully — no crash).
 *
 * Used to hide non-essential UI (hero text, logos) on mobile so the
 * active form stays fully visible above the keyboard, similar to
 * native app behavior.
 *
 * @param threshold - Minimum height delta (px) to consider the
 * keyboard "open". Defaults to 150px, tuned for typical mobile
 * keyboard heights while ignoring minor viewport jitter.
 */
export function useKeyboardOpen(threshold = 150): boolean {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const initialHeight = viewport.height;

    const handleResize = () => {
      const heightDiff = initialHeight - viewport.height;
      setIsKeyboardOpen(heightDiff > threshold);
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, [threshold]);

  return isKeyboardOpen;
}

import { useEffect, useRef, useState } from "react";
import { useMotionValue, animate } from "framer-motion";

const SLOP = 10;

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<unknown> | unknown;
  disabled?: boolean;
  threshold?: number;
  maxPull?: number;
};

/** Native-feeling resistance: near 1:1 for small pulls, flattening out below `max`. */
export function dampen(delta: number, max: number) {
  return max * (1 - Math.exp(-delta / (max * 0.6)));
}

export function usePullToRefresh({
  onRefresh,
  disabled = false,
  threshold = 64,
  maxPull = 96,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pullDistance = useMotionValue(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isRefreshingRef = useRef(false);
  const mountedRef = useRef(true);
  const startRef = useRef({ x: 0, y: 0 });
  const startedAtTopRef = useRef(false);
  const axisRef = useRef<"none" | "vertical" | "horizontal">("none");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current || e.touches.length > 1) return;
      const touch = e.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
      startedAtTopRef.current = (document.scrollingElement?.scrollTop ?? window.scrollY) === 0;
      axisRef.current = "none";
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isRefreshingRef.current || !startedAtTopRef.current) return;

      if (e.touches.length > 1) {
        axisRef.current = "none";
        pullDistance.set(0);
        return;
      }

      const touch = e.touches[0];
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;

      if (axisRef.current === "none") {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SLOP) return;
        axisRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }

      if (axisRef.current !== "vertical") return;

      if (deltaY <= 0) {
        pullDistance.set(0);
        return;
      }

      if (e.cancelable) e.preventDefault();
      pullDistance.set(dampen(deltaY, maxPull));
    };

    const finishGesture = () => {
      if (isRefreshingRef.current) return;
      const wasVertical = axisRef.current === "vertical";
      const raw = pullDistance.get();
      axisRef.current = "none";

      if (!wasVertical) return;

      if (raw >= dampen(threshold, maxPull)) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        animate(pullDistance, threshold * 0.7, { type: "spring", stiffness: 300, damping: 30 });

        Promise.resolve(onRefresh())
          .catch(() => {})
          .then(() => {
            if (!mountedRef.current) return;
            isRefreshingRef.current = false;
            setIsRefreshing(false);
            animate(pullDistance, 0, { type: "spring", stiffness: 300, damping: 30 });
          });
      } else {
        animate(pullDistance, 0, { type: "spring", stiffness: 400, damping: 32 });
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", finishGesture, { passive: true });
    el.addEventListener("touchcancel", finishGesture, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", finishGesture);
      el.removeEventListener("touchcancel", finishGesture);
    };
  }, [disabled, maxPull, onRefresh, pullDistance, threshold]);

  return { containerRef, pullDistance, isRefreshing };
}

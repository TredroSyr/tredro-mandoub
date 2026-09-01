"use client";

import type { ReactNode } from "react";
import { motion, useTransform } from "framer-motion";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";
import { dampen, usePullToRefresh } from "@/hooks/use-pull-to-refresh";

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh: () => Promise<unknown> | unknown;
  disabled?: boolean;
  threshold?: number;
  className?: string;
};

export function PullToRefresh({
  children,
  onRefresh,
  disabled,
  threshold = 64,
  className,
}: PullToRefreshProps) {
  const maxPull = 96;
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh,
    disabled,
    threshold,
    maxPull,
  });

  const visualThreshold = dampen(threshold, maxPull);
  const rotate = useTransform(pullDistance, [0, visualThreshold], [0, 180]);
  const opacity = useTransform(pullDistance, [0, visualThreshold * 0.6], [0, 1]);
  const scale = useTransform(pullDistance, [0, visualThreshold * 0.6], [0.6, 1]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-2"
        style={{ opacity, scale }}
      >
        <motion.div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-primary shadow-(--shadow-raised)"
          style={isRefreshing ? undefined : { rotate }}
          animate={isRefreshing ? { rotate: 360 } : undefined}
          transition={isRefreshing ? { repeat: Infinity, ease: "linear", duration: 0.8 } : undefined}
        >
          <IconRenderer name="refresh_outlined" className="h-4 w-4" />
        </motion.div>
      </motion.div>

      <motion.div style={{ y: pullDistance }}>{children}</motion.div>
    </div>
  );
}

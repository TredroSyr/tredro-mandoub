"use client";

import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";

interface DetermineRouteButtonProps {
  hasTrip: boolean;
  loading: boolean;
  disabled?: boolean;
  onDetermine: () => void;
  onShowRoute: () => void;
  onClearRoute: () => void;
}

/** Sits directly below the DaySelector day badges. Before a route exists it triggers
 * OSRM-trip planning; once one exists it switches to "show the summary drawer again"
 * plus a dedicated clear button, instead of recomputing on every press. */
export function DetermineRouteButton({
  hasTrip,
  loading,
  disabled,
  onDetermine,
  onShowRoute,
  onClearRoute,
}: DetermineRouteButtonProps) {
  if (hasTrip) {
    return (
      <div className="pointer-events-auto mt-2 flex gap-2">
        <Button
          onClick={onShowRoute}
          className="flex-1 rounded-2xl py-2.5 text-xs font-bold"
        >
          <IconRenderer name="map_outlined" className="w-5 h-5" />
          عرض المسار الأمثل
        </Button>
        <Button
          onClick={onClearRoute}
          variant="secondary"
          size="icon"
          aria-label="إلغاء المسار"
          className="shrink-0 rounded-2xl"
        >
          <IconRenderer name="close_outlined" className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto mt-2">
      <Button
        onClick={onDetermine}
        disabled={disabled || loading}
        className="w-full rounded-2xl py-2.5 text-xs font-bold"
      >
        {loading ? (
          <IconRenderer name="refresh_outlined" className="w-5 h-5 animate-spin" />
        ) : (
          <IconRenderer name="double_arrows_right_outlined" className="w-5 h-5" />
        )}
        تحديد المسار الأمثل
      </Button>
    </div>
  );
}

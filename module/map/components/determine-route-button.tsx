"use client";

import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";

interface DetermineRouteButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

/** Sits directly below the DaySelector day badges; triggers OSRM-trip route planning for the current day's shops. */
export function DetermineRouteButton({
  onClick,
  loading,
  disabled,
}: DetermineRouteButtonProps) {
  return (
    <div className="pointer-events-auto mt-2">
      <Button
        onClick={onClick}
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

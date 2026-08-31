"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";

interface ShopListToggleButtonProps {
  visible: boolean;
  dayLabel: string;
  count: number;
  isLoading: boolean;
  onOpen: () => void;
  panelWidthClass: string;
}

/** Floating pill that reopens the shop-list drawer, showing the day's shop count. */
export function ShopListToggleButton({
  visible,
  dayLabel,
  count,
  isLoading,
  onOpen,
  panelWidthClass,
}: ShopListToggleButtonProps) {
  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-[2200] flex justify-center ${panelWidthClass}`}
      style={{ bottom: "0.75rem" }}
    >
      <Button
        onClick={onOpen}
        variant="glass"
        className="pointer-events-auto gap-2 rounded-full px-4 py-2 text-xs shadow-float"
      >
        <IconRenderer name="category_outlined" className="w-5 h-5" />
        محلات {dayLabel}
        {isLoading ? (
          <Skeleton className="h-3 w-3 rounded-full bg-current/20" />
        ) : (
          <span className="font-mono text-[10px] opacity-70">{count}</span>
        )}
      </Button>
    </div>
  );
}

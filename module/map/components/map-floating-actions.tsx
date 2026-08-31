"use client";

import { Crosshair } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";

interface MapFloatingActionsProps {
  visible: boolean;
  floatingBottom: string;
  onLocate: () => void;
  onStartPicking: () => void;
}

/** The "locate me" and "add customer" floating round buttons anchored above the shop-list drawer. */
export function MapFloatingActions({
  visible,
  floatingBottom,
  onLocate,
  onStartPicking,
}: MapFloatingActionsProps) {
  if (!visible) return null;

  return (
    <>
      <div
        className="absolute z-[2200] transition-all duration-300"
        style={{ insetInlineEnd: "0.75rem", bottom: floatingBottom }}
      >
        <Button
          onClick={onLocate}
          aria-label="موقعي الحالي"
          variant="glass"
          className="h-11 w-11 rounded-full border border-glass-border bg-card/95 p-0 text-primary shadow-sheet backdrop-blur-xl hover:bg-card"
        >
          <Crosshair className="size-5" />
        </Button>
      </div>

      <div
        className="absolute z-[2200] transition-all duration-300"
        style={{ insetInlineStart: "0.75rem", bottom: floatingBottom }}
      >
        <Button
          onClick={onStartPicking}
          className="h-11 w-11 rounded-full p-0 text-primary shadow-sheet backdrop-blur-xl hover:bg-card"
        >
          <IconRenderer
            name="plus_outlined"
            className="w-5 h-5 text-primary-foreground"
          />
        </Button>
      </div>
    </>
  );
}

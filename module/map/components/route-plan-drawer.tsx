"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { TripResult, formatDistance, formatDuration } from "@/module/map/lib/routing";

interface RoutePlanDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: TripResult | null;
  onViewStop: (customerId: number) => void;
  bottomNavHeight?: string;
  panelWidthClass?: string;
  overlayZ?: string;
}

export function RoutePlanDrawer({
  open,
  onOpenChange,
  trip,
  onViewStop,
  bottomNavHeight = "var(--bottom-nav-height)",
  panelWidthClass = "md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2",
  overlayZ = "z-[2600]",
}: RoutePlanDrawerProps) {
  if (!trip) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent
        className={`${overlayZ} mt-0 h-[46svh] ${panelWidthClass}`}
        style={{ bottom: bottomNavHeight }}
      >
        <DrawerHeader className="flex justify-between flex-row w-full items-center gap-3 px-5 pb-3 pt-1 text-start">
          <div className="min-w-0">
            <DrawerTitle className="truncate text-base font-extrabold">
              المسار الأمثل
              <span className="ms-2 font-mono text-xs text-muted-foreground">
                {trip.stops.length}
              </span>
            </DrawerTitle>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge>
                <IconRenderer name="clock_outlined" className="w-5 h-5" />
                {formatDuration(trip.totalDuration)}
              </Badge>
              <Badge variant="secondary">
                <IconRenderer name="map_outlined" className="w-5 h-5" />
                {formatDistance(trip.totalDistance)}
              </Badge>
            </div>
          </div>
          <DrawerClose>
            <Button variant="secondary" size="icon-sm">
              <IconRenderer name="close_outlined" className="w-3 h-3" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {trip.stops.map((stop, i) => (
            <button
              key={stop.shop.id}
              onClick={() => onViewStop(stop.shop.customerId)}
              className="mb-2 w-full rounded-2xl border border-border bg-background/60 p-3.5 text-start transition-colors"
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 font-mono text-xs font-extrabold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold">{stop.shop.name}</h4>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {stop.shop.address}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge>
                      <IconRenderer name="clock_outlined" className="w-5 h-5" />
                      {formatDuration(stop.cumulativeDuration)}
                    </Badge>
                    <Badge variant="secondary">
                      <IconRenderer name="map_outlined" className="w-5 h-5" />
                      {formatDistance(stop.legDistance)}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

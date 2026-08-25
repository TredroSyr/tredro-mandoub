"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Shop, distanceKm } from "@/module/map/lib/tour-data";
import { RouteResult, formatDistance, formatDuration } from "@/module/map/lib/routing";

interface NavigationPanelProps {
  shop: Shop;
  origin: [number, number];
  route: RouteResult | null;
  routeLoading: boolean;
  routeError: boolean;
  remaining: { dist: number; dur: number } | null;
  follow: boolean;
  onStopNavigation: () => void;
  onCenterOnUser: () => void;
  panelWidthClass?: string;
  bottomNavHeight?: string;
}

export function NavigationPanel({
  shop,
  origin,
  route,
  routeLoading,
  routeError,
  remaining,
  follow,
  onStopNavigation,
  onCenterOnUser,
  panelWidthClass = "md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2",
  bottomNavHeight = "var(--bottom-nav-height)",
}: NavigationPanelProps) {
  return (
    <>
      <div
        className={`absolute inset-x-3 top-3 z-[1900] glass-panel grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-3xl px-4 py-3 shadow-float ${panelWidthClass}`}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{shop.name}</p>
          <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-primary">
            {routeLoading ? (
              <span className="flex items-center gap-1.5">
                <IconRenderer
                  name="refresh_outlined"
                  className="w-5 h-5 animate-spin"
                />{" "}
                جاري حساب المسار…
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <IconRenderer name="map_outlined" className="w-5 h-5" />
                  {formatDistance(remaining?.dist ?? 0)}
                </span>
                <span className="flex items-center gap-1">
                  <IconRenderer name="clock_outlined" className="w-5 h-5" />
                  {formatDuration(remaining?.dur ?? 0)}
                </span>
                {routeError && (
                  <span className="text-warning-foreground">
                    مسار تقريبي
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <Button
          onClick={onStopNavigation}
          aria-label="إنهاء التوجيه"
          size="icon"
          className="rounded-full"
        >
          <IconRenderer name="close_outlined" className="w-6 h-6" />
        </Button>
      </div>

      {route?.steps?.[0] && (
        <div
          className={`absolute inset-x-3 z-[1900] glass-panel grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl px-4 py-3 shadow-float ${panelWidthClass}`}
          style={{
            bottom: `max(calc(1rem + ${bottomNavHeight}), calc(env(safe-area-inset-bottom) + ${bottomNavHeight}))`,
          }}
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <IconRenderer name="send_filled" className="w-7 h-7" />
          </span>
          <p className="truncate text-xs font-bold">
            {route.steps[0].text}
          </p>
          <Button
            onClick={onCenterOnUser}
            aria-label="إعادة التمركز"
            variant={follow ? "default" : "secondary"}
            size="icon"
            className="rounded-2xl"
          >
            <IconRenderer name="location_filled" className="w-7 h-7" />
          </Button>
        </div>
      )}
    </>
  );
}

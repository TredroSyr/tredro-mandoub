"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  DayKey,
  DAYS,
  getGovernorateCenter,
  distanceKm,
} from "@/module/map/lib/tour-data";
import { useAuthStore } from "@/module/auth/store/auth-store";
import {
  CustomerListItem,
  WORK_DAYS_LABELS,
  filterListItemsByDay,
} from "@/module/customers/lib/utils";
import { SkeletonCard } from "@/components/ui/skeleton";
import { PhoneInput } from "@/components/tredro/phone-input";

// Exported so callers (the map page) can derive the drawer's currently-visible
// height from the same snap fractions, e.g. to position floating buttons flush
// above it without measuring the DOM (the popup moves via transform, not resize).
export const SHOP_LIST_SNAP_POINTS: number[] = [0.5, 0.92];

// The day-badges panel (DaySelector + DetermineRouteButton) floats over the map's
// top-left, roughly 130px tall including its padding. Snap points are fractions of
// this drawer's max travel height, so capping that max height (100dvh - 180px,
// i.e. ~130px panel + 50px clearance below it) keeps every snap state — including
// the dragged-open one — from ever covering the day badges. Kept in sync with
// SHOP_LIST_MAX_HEIGHT_OFFSET_PX below (Tailwind arbitrary values must be a
// static string, so the two can't share a single source of truth).
export const SHOP_LIST_MAX_HEIGHT_OFFSET_PX = 180;

interface ShopListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: DayKey;
  items: CustomerListItem[];
  selectedId: string | null;
  origin: [number, number];
  onSelectItem: (item: CustomerListItem) => void;
  isLoading?: boolean;
  bottomNavHeight?: string;
  panelWidthClass?: string;
  overlayZ?: string;
  /** Fires with the fraction (from SHOP_LIST_SNAP_POINTS) whenever the user drags the
   * drawer to a new snap point, so callers can reposition elements anchored above it. */
  onSnapPointChange?: (snapPoint: number | null) => void;
}

export function ShopListDrawer({
  open,
  onOpenChange,
  day,
  items,
  selectedId,
  origin,
  onSelectItem,
  isLoading,
  onSnapPointChange,
}: ShopListDrawerProps) {
  const dayItems = filterListItemsByDay(items, day);
  const governorate = useAuthStore((s) => s.rep?.company?.governorate);

  const getDistance = (item: CustomerListItem): number => {
    if (item.hasCoordinates && item.lat != null && item.lng != null) {
      return distanceKm(origin, [item.lat, item.lng]);
    }
    return distanceKm(origin, getGovernorateCenter(governorate));
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
      showSwipeHandle
      snapPoints={SHOP_LIST_SNAP_POINTS}
      defaultSnapPoint={SHOP_LIST_SNAP_POINTS[0]}
      onSnapPointChange={(snapPoint) =>
        onSnapPointChange?.(typeof snapPoint === "number" ? snapPoint : null)
      }
    >
      <DrawerContent className="mt-0 data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-180px)]">
        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="flex justify-between flex-row w-full items-center gap-3 px-5 pb-3 pt-1 text-start">
            <div className="min-w-0">
              <DrawerTitle className="truncate text-base font-extrabold">
                محلات {DAYS.find((d) => d.key === day)?.label}
                <span className="ms-2 font-mono text-xs text-muted-foreground">
                  {dayItems.length}
                </span>
              </DrawerTitle>
            </div>
            <DrawerClose>
              <Button variant="secondary" size="icon-sm">
                <IconRenderer name="close_outlined" className="w-3 h-3" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {isLoading ? (
              <div className="space-y-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : dayItems.length === 0 ? (
              <div className="grid place-items-center gap-2 px-6 py-10 text-center">
                <IconRenderer
                  name="category_outlined"
                  className="w-9 h-9 text-muted-foreground/50"
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  لا توجد محلات مضافة لهذا اليوم.
                  <br />
                  اضغط «محل جديد» لإضافة أول محل.
                </p>
              </div>
            ) : (
              dayItems.map((item) => {
                const d = getDistance(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`mb-2 w-full rounded-2xl border p-3.5 text-start transition-colors ${
                      item.id === selectedId
                        ? "border-primary bg-primary/8"
                        : "border-border bg-background/60"
                    } ${!item.hasCoordinates ? "opacity-70" : ""}`}
                  >
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                      <span
                        className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                          item.hasCoordinates
                            ? "bg-primary/12 text-primary"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <IconRenderer
                          name={
                            item.hasCoordinates
                              ? "category_outlined"
                              : "user_outlined"
                          }
                          className="w-7 h-7"
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-sm font-bold">
                            {item.name}
                          </h4>
                          {!item.hasCoordinates && (
                            <Badge variant="outline" className="text-[10px]">
                              بدون موقع
                            </Badge>
                          )}
                          {!item.isActive && item.hasCoordinates && (
                            <Badge variant="secondary" className="text-[10px]">
                              غير نشط
                            </Badge>
                          )}
                        </div>
                        <PhoneInput value={item.phone} readOnly />
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {item.hasCoordinates ? (
                            <Badge>{d.toFixed(1)} كم</Badge>
                          ) : (
                            <Badge variant="outline">
                              {item.workDays
                                .map((d) => WORK_DAYS_LABELS[d] || d)
                                .join(", ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

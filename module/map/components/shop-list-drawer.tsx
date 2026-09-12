"use client";

import { useEffect, useRef } from "react";
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

const SNAP_POINTS = [0.5, 0.92];

// The day-badges panel (DaySelector + DetermineRouteButton) floats over the map's
// top-left, roughly 130px tall including its padding. Snap points are fractions of
// this drawer's max travel height, so capping that max height (100dvh - 180px,
// i.e. ~130px panel + 50px clearance below it) keeps every snap state — including
// the dragged-open one — from ever covering the day badges.

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
  /** Reports the drawer's actual top edge (viewport `getBoundingClientRect().top`, px) whenever it moves, so callers can position elements (e.g. floating buttons) flush against it instead of guessing a fixed height. */
  onTopChange?: (top: number) => void;
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
  onTopChange,
}: ShopListDrawerProps) {
  const dayItems = filterListItemsByDay(items, day);
  const governorate = useAuthStore((s) => s.rep?.company?.governorate);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !onTopChange || !open) return;
    const reportTop = () => onTopChange(el.getBoundingClientRect().top);
    reportTop();

    const observer = new ResizeObserver(reportTop);
    observer.observe(el);

    // With snap points, the popup keeps a near-full-height box and is moved via a
    // `transform`/CSS-var set in its inline `style` (see DrawerPopup) rather than
    // resized — so ResizeObserver alone misses drag and snap-point changes. Watch
    // the popup ancestor's `style` attribute too, which mutates on every frame of
    // a drag and again once it settles on a snap point.
    const popupEl = el.closest('[data-slot="drawer-popup"]');
    const mutationObserver = popupEl ? new MutationObserver(reportTop) : null;
    mutationObserver?.observe(popupEl as Element, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Re-measure on viewport resize too (e.g. mobile address-bar collapse),
    // since the drawer's top can shift even when its own size doesn't.
    window.addEventListener("resize", reportTop);
    return () => {
      observer.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", reportTop);
    };
  }, [onTopChange, open]);

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
      snapPoints={SNAP_POINTS}
      defaultSnapPoint={SNAP_POINTS[0]}
    >
      <DrawerContent className="mt-0 data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-180px)]">
        <div ref={contentRef} className="flex min-h-0 flex-1 flex-col">
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

"use client";

import { useCallback } from "react";
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
import { CustomerListItem, WORK_DAYS_LABELS } from "@/module/customers/lib/utils";
import { Shop, distanceKm } from "@/module/map/lib/tour-data";
import { useUpdateCustomerMutation } from "@/module/customers/hooks";

interface CustomerDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CustomerListItem | null;
  origin: [number, number];
  onStartNavigation: (shop: Shop) => void;
  onEditLocation: (item: CustomerListItem) => void;
  bottomNavHeight?: string;
  panelWidthClass?: string;
  overlayZ?: string;
}

export function CustomerDetailDrawer({
  open,
  onOpenChange,
  item,
  origin,
  onStartNavigation,
  onEditLocation,
  bottomNavHeight = "var(--bottom-nav-height)",
  panelWidthClass = "md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2",
  overlayZ = "z-[2600]",
}: CustomerDetailDrawerProps) {
  const updateCustomerMutation = useUpdateCustomerMutation();

  const handleUpdateLocation = useCallback(
    (latitude: number, longitude: number) => {
      if (!item) return;
      updateCustomerMutation.mutate({
        customerId: item.customerId,
        data: {
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
        },
      });
    },
    [item, updateCustomerMutation]
  );

  if (!item) return null;

  const getDistance = (): number => {
    if (item.hasCoordinates && item.lat != null && item.lng != null) {
      return distanceKm(origin, [item.lat, item.lng]);
    }
    return 0;
  };

  const formatLatLng = (): string => {
    if (item.hasCoordinates && item.lat != null && item.lng != null) {
      const latNum = Number(item.lat);
      const lngNum = Number(item.lng);
      return `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`;
    }
    return "غير متوفر";
  };

  const distance = getDistance();
  const estimatedMinutes = Math.max(2, Math.round(distance * 3));
  const hasValidCoords =
    item.hasCoordinates &&
    item.lat != null &&
    item.lng != null &&
    typeof item.lat === "number" &&
    typeof item.lng === "number";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={`${overlayZ} mt-0 flex h-[75svh] flex-col rounded-t-[1.75rem] border-t border-glass-border bg-card/95 shadow-sheet backdrop-blur-xl ${panelWidthClass} md:rounded-b-[1.75rem]`}
        style={{ bottom: bottomNavHeight }}
      >
        <DrawerHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-4 pt-5 text-start">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                hasValidCoords
                  ? "bg-primary/10 text-primary"
                  : "bg-warning/10 text-warning"
              }`}
            >
              <IconRenderer
                name={hasValidCoords ? "category_outlined" : "warning_outlined"}
                className="h-6 w-6"
              />
            </div>
            <div className="min-w-0">
              <DrawerTitle className="truncate text-base font-extrabold leading-tight">
                {item.name}
              </DrawerTitle>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {item.phone}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {hasValidCoords ? (
                  <>
                    <Badge>
                      <IconRenderer name="map_outlined" className="w-5 h-5" />
                      {distance.toFixed(1)} كم
                    </Badge>
                    <Badge variant="secondary">
                      <IconRenderer name="clock_outlined" className="w-5 h-5" />
                      ~{estimatedMinutes} دقيقة
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className="text-warning">
                    <IconRenderer name="warning_outlined" className="w-4 h-4 ms-1" />
                    بدون موقع على الخريطة
                  </Badge>
                )}
                {!item.isActive && (
                  <Badge variant="secondary">غير نشط</Badge>
                )}
              </div>
            </div>
          </div>

          <DrawerClose>
            <Button variant="secondary" size="icon-sm" className="shrink-0">
              <IconRenderer name="close_outlined" className="w-3 h-3" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {!hasValidCoords && (
          <div className="mx-5 mb-3">
            <div className="rounded-2xl border border-warning/30 bg-warning/5 p-3">
              <div className="flex items-start gap-2">
                <IconRenderer
                  name="warning_outlined"
                  className="mt-0.5 h-5 w-5 shrink-0 text-warning"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-warning-foreground">
                    هذا العميل لا يحتوي على موقع على الخريطة
                  </h4>
                  <p className="mt-1 text-[11px] text-warning-foreground/80">
                    يمكنك إضافة الموقع عن طريق الضغط على الخريطة أدناه.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full border-warning/40 text-warning hover:bg-warning/10"
                    onClick={() => onEditLocation(item)}
                  >
                    <IconRenderer name="pin_outlined" className="w-4 h-4" />
                    أضف الموقع على الخريطة
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs font-extrabold text-primary">
                <IconRenderer name="user_outlined" className="w-6 h-6" />
                المعلومات
              </h4>
            </div>

            <div className="space-y-2 text-sm">
              {item.email && (
                <div className="flex justify-between items-center p-2 rounded-xl bg-muted/50">
                  <span className="text-xs text-muted-foreground">
                    البريد الإلكتروني
                  </span>
                  <span className="text-xs font-medium">{item.email}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 rounded-xl bg-muted/50">
                <span className="text-xs text-muted-foreground">الإحداثيات</span>
                <span className="text-xs font-mono">{formatLatLng()}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-muted/50">
                <span className="text-xs text-muted-foreground">أيام الدورة</span>
                <span className="text-xs font-medium">
                  {item.workDays
                    .map((d) => WORK_DAYS_LABELS[d] || d)
                    .join(", ")}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-auto border-t border-glass-border bg-card/95 px-5 py-4">
          {hasValidCoords ? (
            <Button
              onClick={() => {
                const shopItem: Shop = {
                  type: "branch",
                  id: item.id,
                  name: item.name,
                  address: "",
                  phone: item.phone,
                  day: item.day,
                  lat: Number(item.lat),
                  lng: Number(item.lng),
                  orders: [],
                  invoices: [],
                  payments: [],
                };
                onStartNavigation(shopItem);
              }}
              className="w-full py-3.5 text-sm font-bold"
            >
              <IconRenderer name="send_outlined" className="w-6 h-6" />
              ابدأ التوجه لهذا المحل
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => onEditLocation(item)}
              className="w-full py-3.5 text-sm font-bold"
            >
              <IconRenderer name="pin_outlined" className="w-6 h-6" />
              أضف الموقع على الخريطة
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

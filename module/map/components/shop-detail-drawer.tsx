"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Shop, distanceKm, formatMoney } from "@/module/map/lib/tour-data";

interface ShopDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shop: Shop | null;
  origin: [number, number];
  onStartNavigation: (shop: Shop) => void;
  bottomNavHeight?: string;
  panelWidthClass?: string;
  overlayZ?: string;
}

export function ShopDetailDrawer({
  open,
  onOpenChange,
  shop,
  origin,
  onStartNavigation,
  bottomNavHeight = "var(--bottom-nav-height)",
  panelWidthClass = "md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2",
  overlayZ = "z-[2600]",
}: ShopDetailDrawerProps) {
  if (!shop) return null;

  const distance = distanceKm(origin, [shop.lat, shop.lng]);
  const estimatedMinutes = Math.max(2, Math.round(distance * 3));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={`${overlayZ} mt-0 flex h-[75svh] flex-col rounded-t-[1.75rem] border-t border-glass-border bg-card/95 shadow-sheet backdrop-blur-xl ${panelWidthClass} md:rounded-b-[1.75rem]`}
        style={{ bottom: bottomNavHeight }}
      >
        <DrawerHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-4 pt-5 text-start">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconRenderer name="category_outlined" className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <DrawerTitle className="truncate text-base font-extrabold leading-tight">
                {shop.name}
              </DrawerTitle>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {shop.address}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Badge>
                  <IconRenderer name="map_outlined" className="w-5 h-5" />
                  {distance.toFixed(1)} كم
                </Badge>
                <Badge variant="secondary">
                  <IconRenderer name="clock_outlined" className="w-5 h-5" />
                  ~{estimatedMinutes} دقيقة
                </Badge>
              </div>
            </div>
          </div>

          <DrawerClose>
            <Button variant="secondary" size="icon-sm" className="shrink-0">
              <IconRenderer name="close_outlined" className="w-3 h-3" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs font-extrabold text-primary">
                <IconRenderer name="cart_outlined" className="w-6 h-6" />
                الطلبات
              </h4>
              {shop.orders.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {shop.orders.length}
                </span>
              )}
            </div>

            {shop.orders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 px-3 py-6 text-center">
                <IconRenderer
                  name="cart_outlined"
                  className="h-7 w-7 text-muted-foreground"
                />
                <p className="text-[11px] text-muted-foreground">
                  لا توجد طلبات مسجلة
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/60">
                {shop.orders.map((o, idx) => (
                  <div
                    key={o.id}
                    className={`flex items-center justify-between gap-3 bg-primary/[0.04] px-3.5 py-3 ${
                      idx !== shop.orders.length - 1
                        ? "border-b border-border/60"
                        : ""
                    }`}
                  >
                    <span className="min-w-0 truncate text-xs font-semibold">
                      {o.item}
                    </span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                      ×{o.qty}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs font-extrabold text-primary">
                <IconRenderer name="price_outlined" className="w-6 h-6" />
                تاريخ الفواتير
              </h4>
              {shop.invoices.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {shop.invoices.length}
                </span>
              )}
            </div>

            {shop.invoices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 px-3 py-6 text-center">
                <IconRenderer
                  name="price_outlined"
                  className="h-7 w-7 text-muted-foreground"
                />
                <p className="text-[11px] text-muted-foreground">
                  لا توجد فواتير سابقة
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/60">
                {shop.invoices.map((i, idx) => (
                  <div
                    key={i.id}
                    className={`flex items-center justify-between gap-3 bg-secondary/40 px-3.5 py-3 ${
                      idx !== shop.invoices.length - 1
                        ? "border-b border-border/60"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-semibold">
                        {i.no}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {i.date}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold">
                        {formatMoney(i.amount)}
                      </span>
                      <Badge variant={i.paid ? "success" : "warning"}>
                        {i.paid ? "مدفوعة" : "معلقة"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-auto border-t border-glass-border bg-card/95 px-5 py-4">
          <Button
            onClick={() => onStartNavigation(shop)}
            className="w-full py-3.5 text-sm font-bold"
          >
            <IconRenderer name="send_outlined" className="w-6 h-6" />
            ابدأ التوجه لهذا المحل
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

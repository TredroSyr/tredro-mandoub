"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  ALEPPO_CENTER,
  DayKey,
  DAYS,
  distanceKm,
  formatMoney,
  INITIAL_SHOPS,
  Shop,
} from "@/module/map/lib/tour-data";
import {
  fetchRoute,
  RouteResult,
  bearing as bearingBetween,
  formatDistance,
  formatDuration,
} from "@/module/map/lib/routing";
import {
  clearWatch,
  GeoWatchId,
  getCurrentPosition,
  watchPosition,
  GeoInsecureContextError,
} from "@/module/map/lib/geo";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import TourMap from "@/module/map/components/tour-map";
import { Crosshair } from "lucide-react";
import { useGetCustomersQuery } from "@/module/customers/hooks";
import { customersToShops } from "@/module/customers/lib/utils";
import { Customer } from "@/module/customers/types";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

const BOTTOM_NAV_H_CSS = "var(--bottom-nav-height)";
const PANEL_WIDTH_CLASS =
  "md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2";
const OVERLAY_Z = "z-[2600]";

function todayKey(): DayKey {
  const map: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "sat", "sat"];
  return map[new Date().getDay()] ?? "sun";
}

const LOCATION_ERROR_MESSAGES: Record<"denied" | "insecure", string> = {
  denied:
    "لم تمنحنا صلاحية الوصول لموقعك. يرجى تفعيلها من إعدادات المتصفح أو التطبيق.",
  insecure:
    "يتطلب تحديد الموقع اتصالاً آمناً (https). يرجى فتح الموقع عبر رابط https:// والمحاولة مرة أخرى.",
};

export default function TourPage() {
  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery();
  const apiCustomers = customersData?.data?.customers ?? [];
  const [localShops, setLocalShops] = useState<Shop[]>([]);
  
  const shops = useMemo(() => {
    const apiShops = customersToShops(apiCustomers);
    return [...apiShops, ...localShops];
  }, [apiCustomers, localShops]);

  const [day, setDay] = useState<DayKey>(todayKey());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locState, setLocState] = useState<
    "off" | "live" | "denied" | "insecure"
  >("off");
  const [locMsgVisible, setLocMsgVisible] = useState(false);
  const [focus, setFocus] = useState<{
    center: [number, number];
    zoom?: number;
    nonce: number;
  } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(null);
  const [pickingLocLoading, setPickingLocLoading] = useState(false);
  const [navShop, setNavShop] = useState<Shop | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    day: todayKey() as DayKey,
  });
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [heading, setHeading] = useState(0);
  const [follow, setFollow] = useState(true);
  const nonce = useRef(0);
  const watchId = useRef<GeoWatchId | null>(null);
  const locMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dayShops = useMemo(
    () => shops.filter((s) => s.day === day),
    [shops, day],
  );
  const origin = userPos ?? ALEPPO_CENTER;
  const selected = shops.find((s) => s.id === selectedId) ?? null;
  const overlayOpen = addOpen || !!selected || listOpen;

  const flyTo = (center: [number, number], zoom = 16) =>
    setFocus({ center, zoom, nonce: ++nonce.current });

  const flashLocationError = (state: "denied" | "insecure") => {
    setLocState(state);
    setLocMsgVisible(true);
    if (locMsgTimer.current) clearTimeout(locMsgTimer.current);
    locMsgTimer.current = setTimeout(() => setLocMsgVisible(false), 5000);
  };

  const handleGeoError = useCallback((err: unknown) => {
    if (err instanceof GeoInsecureContextError) {
      flashLocationError("insecure");
    } else {
      flashLocationError("denied");
    }
  }, []);

  const locate = useCallback(() => {
    getCurrentPosition()
      .then((pos) => {
        setUserPos(pos);
        setLocState("live");
        flyTo(pos, 15);
      })
      .catch(handleGeoError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGeoError]);

  const useMyLocationForShop = useCallback(() => {
    setPickingLocLoading(true);
    getCurrentPosition()
      .then((pos) => {
        setUserPos(pos);
        setLocState("live");
        setPickedPoint(pos);
        flyTo(pos, 17);
      })
      .catch(handleGeoError)
      .finally(() => setPickingLocLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGeoError]);

  useEffect(() => {
    setSelectedId(null);
  }, [day]);

  useEffect(() => {
    if (!navShop) return;
    let cancelled = false;
    watchPosition(
      (pos, headingDeg) => {
        if (cancelled) return;
        setUserPos(pos);
        setLocState("live");
        if (headingDeg !== null) setHeading(headingDeg);
      },
      (reason) => {
        if (cancelled) return;
        flashLocationError(reason === "insecure" ? "insecure" : "denied");
      },
    ).then((id) => {
      if (cancelled) clearWatch(id);
      else watchId.current = id;
    });
    return () => {
      cancelled = true;
      if (watchId.current) clearWatch(watchId.current);
      watchId.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navShop]);

  useEffect(() => {
    if (!navShop) {
      setRoute(null);
      setRouteError(false);
      return;
    }
    const ac = new AbortController();
    setRouteLoading(true);
    setRouteError(false);
    fetchRoute(origin, [navShop.lat, navShop.lng], ac.signal)
      .then((r) => {
        setRoute(r);
        setRouteError(false);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setRouteError(true);
      })
      .finally(() => setRouteLoading(false));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navShop, origin[0].toFixed(3), origin[1].toFixed(3)]);

  const lastFollowFlyAt = useRef(0);

  useEffect(() => {
    if (!navShop || !follow || !userPos) return;
    const now = Date.now();
    if (now - lastFollowFlyAt.current < 700) return;
    lastFollowFlyAt.current = now;

    const pts = route?.coords ?? [
      [navShop.lat, navShop.lng] as [number, number],
    ];
    const ahead =
      pts.find((c) => distanceKm(userPos, c) > 0.04) ??
      pts[pts.length - 1] ??
      userPos;
    const b = bearingBetween(userPos, ahead);
    setHeading(b);
    setBearing(b);
    flyTo(userPos, 17);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navShop, follow, userPos, route]);

  const remaining = useMemo(() => {
    if (!navShop) return null;
    if (route) return { dist: route.distance, dur: route.duration };
    const km = distanceKm(origin, [navShop.lat, navShop.lng]);
    return { dist: km * 1000, dur: km * 180 };
  }, [navShop, route, origin]);

  const openShop = (s: Shop) => {
    setSelectedId(s.id);
    flyTo([s.lat, s.lng], 16);
    setListOpen(false);
  };

  const saveShop = () => {
    if (!form.name.trim() || !pickedPoint) return;
    const s: Shop = {
      type: "branch",
      id: crypto.randomUUID(),
      name: form.name.trim(),
      address: form.address.trim() || "بدون عنوان",
      phone: "963900000000",
      day: form.day,
      lat: pickedPoint[0],
      lng: pickedPoint[1],
      orders: [],
      invoices: [],
      payments: [],
    };
    setLocalShops((prev) => [...prev, s]);
    setDay(s.day);
    setAddOpen(false);
    setPickedPoint(null);
    setPicking(false);
    setForm({ name: "", address: "", day: s.day });
  };

  // TODO: These values are tied to the drawer heights in the JSX (h-[46svh], h-[75svh]).
  // For Leaflet's fitBounds, we need pixel estimates.
  // 46svh ≈ 340px on typical mobile, 100px = minimal offset when closed.
  // The nav height is approx 64px (4rem) + safe area, but Leaflet needs a static number.
  const NAV_H_ESTIMATE = 64;
  const bottomInset = (listOpen ? 340 : 100) + NAV_H_ESTIMATE;
  const floatingBottom = listOpen
    ? `calc(46svh + 0.7rem)`
    : `0rem`;

  return (
    <main
      className="fixed inset-x-0 top-0 overflow-hidden bg-background"
      style={{ bottom: BOTTOM_NAV_H_CSS }}
    >
      <TourMap
        shops={dayShops}
        selectedId={selectedId}
        onSelect={(id) => {
          const s = shops.find((x) => x.id === id);
          if (s) openShop(s);
        }}
        picking={picking}
        onPick={(lat, lng) => {
          setPickedPoint([lat, lng]);
          setPicking(false);
          setAddOpen(true);
        }}
        pickedPoint={pickedPoint}
        userPos={userPos}
        focus={focus}
        bottomInset={bottomInset}
        route={route?.coords ?? null}
        bearing={bearing}
        onBearingChange={(deg) => {
          setBearing(deg);
          if (navShop && Math.abs(deg - heading) > 8) setFollow(false);
        }}
        heading={heading}
        navMode={!!navShop}
        overlayOpen={overlayOpen}
      />

      {(locState === "denied" || locState === "insecure") && locMsgVisible && (
        <div
          className={`pointer-events-none absolute inset-x-3 top-3 z-[2100] flex justify-center ${PANEL_WIDTH_CLASS}`}
        >
          <div className="pointer-events-auto glass-panel flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-float">
            <IconRenderer
              name="warning_outlined"
              className="w-5 h-5 shrink-0 text-warning-foreground"
            />
            <span className="min-w-0">{LOCATION_ERROR_MESSAGES[locState]}</span>
            <button
              onClick={() => setLocMsgVisible(false)}
              aria-label="إغلاق"
              className="shrink-0 opacity-60"
            >
              <IconRenderer name="close_outlined" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {!navShop && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-[2200] p-3 ${PANEL_WIDTH_CLASS}`}
        >
          <div className="pointer-events-auto mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DAYS.map((d) => {
              const count = shops.filter((s) => s.day === d.key).length;
              const active = d.key === day;
              return (
                <Button
                  key={d.key}
                  onClick={() => setDay(d.key)}
                  variant={active ? "default" : "secondary"}
                  size="sm"
                  className="shrink-0 rounded-2xl px-3.5"
                >
                  {d.label}
                  <span className="ms-1.5 font-mono text-[10px] opacity-70">
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

{!navShop && !addOpen && !picking && (
  <>
    <div
      className="absolute z-[2200] transition-all duration-300"
      style={{
        insetInlineEnd: "0.75rem",
        bottom: floatingBottom,
      }}
    >
      <Button
        onClick={locate}
        aria-label="موقعي الحالي"
        variant='glass'
        className="h-11 w-11 rounded-full border border-glass-border bg-card/95 p-0 text-primary shadow-sheet backdrop-blur-xl hover:bg-card"
        >
        <Crosshair className="size-5" />
      </Button>
    </div>

    <div
      className="absolute z-[2200] transition-all duration-300"
      style={{
        insetInlineStart: "0.75rem",
        bottom: floatingBottom,
      }}
    >
      <Button
        onClick={() => {
          setPicking(true);
          setAddOpen(false);
          setListOpen(false);
        }}
        className="h-11 w-11 rounded-full   p-0 text-primary shadow-sheet backdrop-blur-xl hover:bg-card"
      >
        <IconRenderer name="plus_outlined" className="w-5 h-5 text-primary-foreground" />
      </Button>
    </div>
  </>
)}
      {picking && (
        <div
          className={`absolute inset-x-3 z-[2200] glass-panel flex items-center gap-3 rounded-3xl p-3 shadow-float ${PANEL_WIDTH_CLASS}`}
          style={{ bottom: "1rem" }}
        >
          <IconRenderer
            name="pin_outlined"
            className="w-7 h-7 shrink-0 text-primary"
          />
          <p className="min-w-0 flex-1 text-xs font-bold">
            اضغط على الخريطة لتحديد موقع المحل
          </p>
          <Button
            onClick={() => {
              setPicking(false);
              setAddOpen(true);
            }}
            variant="secondary"
            size="sm"
            className="shrink-0 rounded-xl"
          >
            إلغاء
          </Button>
        </div>
      )}

      {!navShop && !listOpen && !addOpen && !picking && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-[2200] flex justify-center ${PANEL_WIDTH_CLASS}`}
          style={{ bottom: "0.75rem" }}
        >
          <Button
            onClick={() => setListOpen(true)}
            variant="glass"
            className="pointer-events-auto gap-2 rounded-full px-4 py-2 text-xs shadow-float"
          >
            <IconRenderer name="category_outlined" className="w-5 h-5" />
            محلات {DAYS.find((d) => d.key === day)?.label}
            <span className="font-mono text-[10px] opacity-70">
              {dayShops.length}
            </span>
          </Button>
        </div>
      )}

<Drawer
  open={!navShop && listOpen}
  onOpenChange={setListOpen}
  modal={false}
>
  <DrawerContent
    className={`${OVERLAY_Z} mt-0 h-[46svh]   ${PANEL_WIDTH_CLASS} `}
    style={{ bottom: BOTTOM_NAV_H_CSS }}
  >
    <DrawerHeader className="flex justify-between flex-row w-full items-center gap-3 px-5 pb-3 pt-1 text-start">
      <div className="min-w-0">
       
        <DrawerTitle className="truncate text-base font-extrabold">
          محلات {DAYS.find((d) => d.key === day)?.label}
          <span className="ms-2 font-mono text-xs text-muted-foreground">
            {dayShops.length}
          </span>
        </DrawerTitle>
      </div>
      <DrawerClose >
        <Button variant="secondary" size="icon-sm">
          <IconRenderer name="close_outlined" className="w-3 h-3" />
        </Button>
      </DrawerClose>
    </DrawerHeader>

    <div className="flex-1 overflow-y-auto px-3 pb-6">
      {dayShops.length === 0 ? (
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
        dayShops.map((s) => {
          const d = distanceKm(origin, [s.lat, s.lng]);
          const unpaid = s.invoices.filter((i) => !i.paid).length;
          return (
            <button
              key={s.id}
              onClick={() => openShop(s)}
              className={`mb-2 w-full rounded-2xl border p-3.5 text-start transition-colors ${
                s.id === selectedId
                  ? "border-primary bg-primary/8"
                  : "border-border bg-background/60"
              }`}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                  <IconRenderer
                    name="category_outlined"
                    className="w-7 h-7"
                  />
                </span>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold">{s.name}</h4>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {s.address}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge>{d.toFixed(1)} كم</Badge>
                    {s.orders.length > 0 && (
                      <Badge variant="secondary">
                        {s.orders.length} طلب
                      </Badge>
                    )}
                    {unpaid > 0 && (
                      <Badge variant="warning">
                        {unpaid} فاتورة معلقة
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
  </DrawerContent>
</Drawer>

<Drawer
  open={!!selected && !navShop}
  onOpenChange={(open) => !open && setSelectedId(null)}
>
  <DrawerContent
    className={`${OVERLAY_Z} mt-0 flex h-[75svh] flex-col rounded-t-[1.75rem] border-t border-glass-border bg-card/95 shadow-sheet backdrop-blur-xl ${PANEL_WIDTH_CLASS} md:rounded-b-[1.75rem]`}
    style={{ bottom: BOTTOM_NAV_H_CSS }}
  >
    {selected && (
      <>
        <DrawerHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-4 pt-5 text-start">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconRenderer name="category_outlined" className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <DrawerTitle className="truncate text-base font-extrabold leading-tight">
                {selected.name}
              </DrawerTitle>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {selected.address}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Badge>
                  <IconRenderer name="map_outlined" className="w-5 h-5" />
                  {distanceKm(origin, [selected.lat, selected.lng]).toFixed(1)} كم
                </Badge>
                <Badge variant="secondary">
                  <IconRenderer name="clock_outlined" className="w-5 h-5" />
                  ~
                  {Math.max(
                    2,
                    Math.round(
                      distanceKm(origin, [selected.lat, selected.lng]) * 3,
                    ),
                  )}{" "}
                  دقيقة
                </Badge>
              </div>
            </div>
          </div>

          <DrawerClose >
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
              {selected.orders.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {selected.orders.length}
                </span>
              )}
            </div>

            {selected.orders.length === 0 ? (
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
                {selected.orders.map((o, idx) => (
                  <div
                    key={o.id}
                    className={`flex items-center justify-between gap-3 bg-primary/[0.04] px-3.5 py-3 ${
                      idx !== selected.orders.length - 1
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
              {selected.invoices.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {selected.invoices.length}
                </span>
              )}
            </div>

            {selected.invoices.length === 0 ? (
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
                {selected.invoices.map((i, idx) => (
                  <div
                    key={i.id}
                    className={`flex items-center justify-between gap-3 bg-secondary/40 px-3.5 py-3 ${
                      idx !== selected.invoices.length - 1
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
            onClick={() => {
              setNavShop(selected);
              setFollow(true);
              if (!userPos) locate();
              flyTo([selected.lat, selected.lng], 17);
            }}
            className="w-full py-3.5 text-sm font-bold"
          >
            <IconRenderer name="send_outlined" className="w-6 h-6" />
            ابدأ التوجه لهذا المحل
          </Button>
        </div>
      </>
    )}
  </DrawerContent>
</Drawer>

<Drawer open={addOpen} onOpenChange={setAddOpen}>
  <DrawerContent
    className={`${OVERLAY_Z} mt-0 h-[75svh] rounded-t-[1.75rem] border-t border-glass-border bg-card/95 shadow-sheet backdrop-blur-xl ${PANEL_WIDTH_CLASS} md:rounded-b-[1.75rem]`}
    style={{ bottom: BOTTOM_NAV_H_CSS }}
  >
    <DrawerHeader className="flex justify-between flex-row w-full items-center gap-3 px-5 pb-3 pt-1 text-start">
      <DrawerTitle className="truncate text-base">محل جديد</DrawerTitle>
      <DrawerClose >
        <Button variant="secondary" size="icon-sm">
          <IconRenderer name="close_outlined" className="w-3 h-3" />
        </Button>
      </DrawerClose>
    </DrawerHeader>
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      <div>
        <label className="mb-1.5 block text-[11px] font-bold text-primary">
          اسم المحل
        </label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="مثال: بقالية الشهباء"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-bold text-primary">
          العنوان
        </label>
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="الحي، الشارع"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-bold text-primary">
          يوم الدورة
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => (
            <Button
              key={d.key}
              onClick={() => setForm({ ...form, day: d.key })}
              variant={form.day === d.key ? "default" : "secondary"}
              size="sm"
              className="rounded-xl"
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-bold text-primary">
          الموقع على الخريطة
        </label>
        <div className="space-y-2">
          <Button
            onClick={() => {
              setAddOpen(false);
              setPicking(true);
            }}
            variant="outline"
            className="w-full border-2 border-dashed border-primary bg-primary/8 py-3 text-xs text-primary"
          >
            <IconRenderer name="pin_outlined" className="w-6 h-6" />
            {pickedPoint
              ? "تعديل الموقع"
              : "حدد الموقع بالضغط على الخريطة"}
          </Button>
          <Button
            onClick={useMyLocationForShop}
            disabled={pickingLocLoading}
            variant="secondary"
            className="w-full py-3 text-xs"
          >
            <IconRenderer
              name={
                pickingLocLoading ? "refresh_outlined" : "cursor_outlined"
              }
              className={`w-6 h-6 ${
                pickingLocLoading ? "animate-spin" : ""
              }`}
            />
            {pickingLocLoading ? "جاري جلب موقعك…" : "استخدم موقعي الحالي"}
          </Button>
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {pickedPoint
            ? `${pickedPoint[0].toFixed(5)}, ${pickedPoint[1].toFixed(5)}`
            : "لم يتم تحديد الموقع بعد"}
        </p>
      </div>
    </div>
    <div className="px-5 pb-4">
      <Button
        disabled={!form.name.trim() || !pickedPoint}
        onClick={saveShop}
        className="w-full py-3.5 text-sm"
      >
        <IconRenderer name="tick_outlined" className="w-6 h-6" /> حفظ
        المحل
      </Button>
    </div>
  </DrawerContent>
</Drawer>
      {navShop && (
        <>
          <div
            className={`absolute inset-x-3 top-3 z-[1900] glass-panel grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-3xl px-4 py-3 shadow-float ${PANEL_WIDTH_CLASS}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{navShop.name}</p>
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
              onClick={() => setNavShop(null)}
              aria-label="إنهاء التوجيه"
              size="icon"
              className="rounded-full"
            >
              <IconRenderer name="close_outlined" className="w-6 h-6" />
            </Button>
          </div>

          {route?.steps?.[0] && (
            <div
              className={`absolute inset-x-3 z-[1900] glass-panel grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl px-4 py-3 shadow-float ${PANEL_WIDTH_CLASS}`}
              style={{
                bottom: `max(calc(1rem + ${BOTTOM_NAV_H_CSS}), calc(env(safe-area-inset-bottom) + ${BOTTOM_NAV_H_CSS}))`,
              }}
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <IconRenderer name="send_filled" className="w-7 h-7" />
              </span>
              <p className="truncate text-xs font-bold">
                {route.steps[0].text}
              </p>
              <Button
                onClick={() => {
                  setFollow(true);
                  if (userPos) flyTo(userPos, 17);
                  else locate();
                }}
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
      )}
    </main>
  );
}

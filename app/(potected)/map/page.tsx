"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Crosshair } from "lucide-react";
import { PhoneInput } from "@/components/tredro/phone-input";
import { useGetCustomersQuery, useUpdateCustomerMutation } from "@/module/customers/hooks";
import { customersToShops, customersToListItems, CustomerListItem } from "@/module/customers/lib/utils";
import {
  DayKey,
  DAYS,
  ALEPPO_CENTER,
  distanceKm,
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
import { TourMap } from "@/module/map/components/tour-map";
import { DaySelector } from "@/module/map/components/day-selector";
import { ShopListDrawer } from "@/module/map/components/shop-list-drawer";
import { AddCustomerDrawer } from "@/module/map/components/add-customer-drawer";
import { NavigationPanel } from "@/module/map/components/navigation-panel";
import {
  BOTTOM_NAV_H_CSS,
  PANEL_WIDTH_CLASS,
  OVERLAY_Z,
  NAV_H_ESTIMATE,
} from "@/module/map/lib/constants";

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

  // For map display - only customers with coordinates
  const shops = useMemo(() => {
    return customersToShops(apiCustomers);
  }, [apiCustomers]);

  // For lists - ALL customers including those without coordinates
  const listItems = useMemo(() => {
    return customersToListItems(apiCustomers);
  }, [apiCustomers]);

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
  const [pickingForEdit, setPickingForEdit] = useState<CustomerListItem | null>(null);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(null);
  const [pickingLocLoading, setPickingLocLoading] = useState(false);
  const [navShop, setNavShop] = useState<Shop | null>(null);
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
  const selectedListItem = listItems.find((item) => item.id === selectedId) ?? null;
  const overlayOpen = addOpen || !!selected || !!selectedListItem || listOpen || !!pickingForEdit;

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

  const updateCustomerLocMutation = useUpdateCustomerMutation();

  const handleAddCustomerSuccess = () => {
    setAddOpen(false);
    setPickedPoint(null);
    setPicking(false);
    setListOpen(true);
  };

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

  const openListItem = (item: CustomerListItem) => {
    setSelectedId(item.id);
    // Only fly to if has coordinates
    if (item.hasCoordinates && item.lat != null && item.lng != null) {
      flyTo([item.lat, item.lng], 16);
    }
    setListOpen(false);
  };

  // TODO: These values are tied to the drawer heights in the JSX (h-[46svh], h-[75svh]).
  // For Leaflet's fitBounds, we need pixel estimates.
  // 46svh ≈ 340px on typical mobile, 100px = minimal offset when closed.
  // The nav height is approx 64px (4rem) + safe area, but Leaflet needs a static number.
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
          const item = listItems.find((x) => x.id === id);
          if (item) openListItem(item);
        }}
        picking={picking}
        onPick={(lat, lng) => {
          if (pickingForEdit) {
            // Update existing customer location
            updateCustomerLocMutation.mutate(
              {
                customerId: pickingForEdit.customerId,
                data: {
                  latitude: Number(lat.toFixed(6)),
                  longitude: Number(lng.toFixed(6)),
                },
              },
              {
                onSuccess: () => {
                  setSelectedId(null);
                  setPickingForEdit(null);
                  setPicking(false);
                },
              }
            );
          } else {
            // Add new customer
            setPickedPoint([lat, lng]);
            setPicking(false);
            setAddOpen(true);
          }
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
          <DaySelector
            day={day}
            onDayChange={setDay}
            customers={apiCustomers}
            isLoading={isLoadingCustomers}
          />
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
              className="h-11 w-11 rounded-full p-0 text-primary shadow-sheet backdrop-blur-xl hover:bg-card"
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
            className={`w-7 h-7 shrink-0 ${pickingForEdit ? "text-warning" : "text-primary"}`}
          />
          <p className="min-w-0 flex-1 text-xs font-bold">
            {pickingForEdit
              ? `اضغط على الخريطة لتحديد موقع: ${pickingForEdit.name}`
              : "اضغط على الخريطة لتحديد موقع المحل الجديد"}
          </p>
          <Button
            onClick={() => {
              setPicking(false);
              setPickingForEdit(null);
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
            {isLoadingCustomers ? (
              <Skeleton className="h-3 w-3 rounded-full bg-current/20" />
            ) : (
              <span className="font-mono text-[10px] opacity-70">
                {dayShops.length}
              </span>
            )}
          </Button>
        </div>
      )}

      <ShopListDrawer
        open={!navShop && listOpen}
        onOpenChange={setListOpen}
        day={day}
        items={listItems}
        selectedId={selectedId}
        origin={origin}
        onSelectItem={openListItem}
        isLoading={isLoadingCustomers}
        bottomNavHeight={BOTTOM_NAV_H_CSS}
        panelWidthClass={PANEL_WIDTH_CLASS}
        overlayZ={OVERLAY_Z}
      />

      {selectedListItem && (
        <Drawer
          open={!!selectedListItem && !navShop}
          onOpenChange={(open) => !open && setSelectedId(null)}
        >
          <DrawerContent
            className={`${OVERLAY_Z} mt-0 flex h-[75svh] flex-col rounded-t-[1.75rem] border-t border-glass-border bg-card/95 shadow-sheet backdrop-blur-xl ${PANEL_WIDTH_CLASS} md:rounded-b-[1.75rem]`}
            style={{ bottom: BOTTOM_NAV_H_CSS }}
          >
            <DrawerHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-4 pt-5 text-start">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    selectedListItem.hasCoordinates
                      ? "bg-primary/10 text-primary"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  <IconRenderer
                    name={selectedListItem.hasCoordinates ? "category_outlined" : "warning_outlined"}
                    className="h-6 w-6"
                  />
                </div>
                <div className="min-w-0">
                  <DrawerTitle className="truncate text-base font-extrabold leading-tight">
                    {selectedListItem.name}
                  </DrawerTitle>
                
                   <PhoneInput value={selectedListItem.phone} readOnly/>  
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {selectedListItem.hasCoordinates &&
                    selectedListItem.lat != null &&
                    selectedListItem.lng != null &&
                    typeof selectedListItem.lat === "number" &&
                    typeof selectedListItem.lng === "number" ? (
                      <>
                        <Badge>
                          <IconRenderer name="map_outlined" className="w-5 h-5" />
                          {distanceKm(origin, [selectedListItem.lat, selectedListItem.lng]).toFixed(1)} كم
                        </Badge>
                        <Badge variant="secondary">
                          <IconRenderer name="clock_outlined" className="w-5 h-5" />
                          ~{Math.max(2, Math.round(distanceKm(origin, [selectedListItem.lat, selectedListItem.lng]) * 3))} دقيقة
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-warning">
                        <IconRenderer name="warning_outlined" className="w-4 h-4 ms-1" />
                        بدون موقع على الخريطة
                      </Badge>
                    )}
                    {!selectedListItem.isActive && (
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

            {!selectedListItem.hasCoordinates && (
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
                        يمكنك إضافة الموقع عن طريق الضغط على الزر أدناه ثم تحديد الموقع على الخريطة.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full border-warning/40 text-warning hover:bg-warning/10"
                        onClick={() => {
                          setSelectedId(null);
                          setPicking(true);
                          setPickingForEdit(selectedListItem);
                        }}
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
                  {selectedListItem.email && (
                    <div className="flex justify-between items-center p-2 rounded-xl bg-muted/50">
                      <span className="text-xs text-muted-foreground">البريد الإلكتروني</span>
                      <span className="text-xs font-medium">{selectedListItem.email}</span>
                    </div>
                  )}
             
                </div>
              </section>
            </div>

            <div className="mt-auto border-t border-glass-border bg-card/95 px-5 py-4">
              {selectedListItem.hasCoordinates &&
              selectedListItem.lat != null &&
              selectedListItem.lng != null &&
              typeof selectedListItem.lat === "number" &&
              typeof selectedListItem.lng === "number" ? (
                <Button
                  onClick={() => {
                    const shopItem: Shop = {
                      type: "branch",
                      id: selectedListItem.id,
                      name: selectedListItem.name,
                      address: "",
                      phone: selectedListItem.phone,
                      day: selectedListItem.day,
                      lat: selectedListItem.lat!,
                      lng: selectedListItem.lng!,
                      orders: [],
                      invoices: [],
                      payments: [],
                    };
                    setNavShop(shopItem);
                    setFollow(true);
                    if (!userPos) locate();
                    flyTo([selectedListItem.lat!, selectedListItem.lng!], 17);
                  }}
                  className="w-full py-3.5 text-sm font-bold"
                >
                  <IconRenderer name="send_outlined" className="w-6 h-6" />
                  ابدأ التوجه لهذا المحل
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedId(null);
                    setPicking(true);
                    setPickingForEdit(selectedListItem);
                  }}
                  className="w-full py-3.5 text-sm font-bold"
                >
                  <IconRenderer name="pin_outlined" className="w-6 h-6" />
                  أضف الموقع على الخريطة
                </Button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <AddCustomerDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        pickedPoint={pickedPoint}
        onPickLocation={() => setPicking(true)}
        onUseMyLocation={useMyLocationForShop}
        isLoadingLocation={pickingLocLoading}
        onSuccess={handleAddCustomerSuccess}
        bottomNavHeight={BOTTOM_NAV_H_CSS}
        panelWidthClass={PANEL_WIDTH_CLASS}
        overlayZ={OVERLAY_Z}
      />

      {navShop && (
        <NavigationPanel
          shop={navShop}
          origin={origin}
          route={route}
          routeLoading={routeLoading}
          routeError={routeError}
          remaining={remaining}
          follow={follow}
          onStopNavigation={() => setNavShop(null)}
          onCenterOnUser={() => {
            setFollow(true);
            if (userPos) flyTo(userPos, 17);
            else locate();
          }}
          panelWidthClass={PANEL_WIDTH_CLASS}
          bottomNavHeight={BOTTOM_NAV_H_CSS}
        />
      )}
    </main>
  );
}

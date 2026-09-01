"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useGetCustomersQuery } from "@/module/customers/hooks";
import {
  customersToShops,
  customersToListItems,
  filterCustomersByDay,
  CustomerListItem,
} from "@/module/customers/lib/utils";
import { DayKey, DAYS, getTodayDayKey } from "@/module/map/lib/tour-data";
import { getCurrentPosition } from "@/module/map/lib/geo";
import { useMapFocus } from "@/module/map/lib/use-map-focus";
import { useTourNavigation } from "@/module/map/lib/use-tour-navigation";
import { useRoutePlan } from "@/module/map/lib/use-route-plan";
import { TourMap } from "@/module/map/components/tour-map";
import { DaySelector } from "@/module/map/components/day-selector";
import { DetermineRouteButton } from "@/module/map/components/determine-route-button";
import { RoutePlanDrawer } from "@/module/map/components/route-plan-drawer";
import { ShopListDrawer } from "@/module/map/components/shop-list-drawer";
import { AddCustomerDrawer } from "@/module/map/components/add-customer-drawer";
import { NavigationPanel } from "@/module/map/components/navigation-panel";
import { LocationErrorBanner } from "@/module/map/components/location-error-banner";
import { MapFloatingActions } from "@/module/map/components/map-floating-actions";
import { LocationPickingBanner } from "@/module/map/components/location-picking-banner";
import { ShopListToggleButton } from "@/module/map/components/shop-list-toggle-button";
import {
  BOTTOM_NAV_H_CSS,
  PANEL_WIDTH_CLASS,
  OVERLAY_Z,
  NAV_H_ESTIMATE,
} from "@/module/map/lib/constants";

export default function TourPage() {
  const router = useRouter();
  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery();
  const apiCustomers = customersData?.data?.customers ?? [];

  // For lists - ALL customers including those without coordinates
  const listItems = useMemo(
    () => customersToListItems(apiCustomers),
    [apiCustomers],
  );

  const [day, setDay] = useState<DayKey>(getTodayDayKey());
  const [listOpen, setListOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(
    null,
  );
  const [pickingLocLoading, setPickingLocLoading] = useState(false);
  const [routePlanDrawerOpen, setRoutePlanDrawerOpen] = useState(false);

  const { focus, flyTo } = useMapFocus();
  const nav = useTourNavigation({ flyTo });
  const routePlan = useRoutePlan();

  const dayShops = useMemo(
    () => customersToShops(filterCustomersByDay(apiCustomers, day)),
    [apiCustomers, day],
  );
  const overlayOpen = addOpen || listOpen;

  // Route planning and active turn-by-turn navigation are mutually exclusive
  // in the UI — starting one clears the other, and switching days invalidates
  // a plan computed for the previous day's shop list. Closing the summary
  // drawer on its own must NOT clear the plan — only this does, so the route
  // stays drawn on the map while the drawer is collapsed.
  useEffect(() => {
    if (nav.navShop) {
      routePlan.clearPlan();
      setRoutePlanDrawerOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.navShop]);

  useEffect(() => {
    routePlan.clearPlan();
    setRoutePlanDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  const handleDetermineRoute = async () => {
    await routePlan.planRoute(dayShops);
    setRoutePlanDrawerOpen(true);
  };

  const handleAddCustomerSuccess = () => {
    setAddOpen(false);
    setPickedPoint(null);
    setPicking(false);
    setListOpen(true);
  };

  const useMyLocationForShop = useCallback(() => {
    setPickingLocLoading(true);
    getCurrentPosition()
      .then((pos) => {
        nav.reportPosition(pos);
        setPickedPoint(pos);
        flyTo(pos, 17);
      })
      .catch(nav.handleGeoError)
      .finally(() => setPickingLocLoading(false));
  }, [nav.reportPosition, nav.handleGeoError, flyTo]);

  const openListItem = (item: CustomerListItem) => {
    router.push(`/stores/detail?id=${item.customerId}`);
  };

  // TODO: These values are tied to the drawer heights in the JSX (h-[46svh], h-[75svh]).
  // For Leaflet's fitBounds, we need pixel estimates.
  // 46svh ≈ 340px on typical mobile, 100px = minimal offset when closed.
  // The nav height is approx 64px (4rem) + safe area, but Leaflet needs a static number.
  const bottomInset = (listOpen ? 340 : 100) + NAV_H_ESTIMATE;
  const floatingBottom = listOpen ? `calc(46svh + 0.7rem)` : `0rem`;

  return (
    <main
      className="fixed inset-x-0 top-0 overflow-hidden bg-background"
      style={{ bottom: BOTTOM_NAV_H_CSS }}
    >
      <TourMap
        shops={dayShops}
        selectedId={null}
        onSelect={() => {}}
        onViewDetails={(customerId) =>
          router.push(`/stores/detail?id=${customerId}`)
        }
        picking={picking}
        onPick={(lat, lng) => {
          setPickedPoint([lat, lng]);
          setPicking(false);
          setAddOpen(true);
        }}
        pickedPoint={pickedPoint}
        userPos={nav.userPos}
        focus={focus}
        bottomInset={bottomInset}
        route={nav.route?.coords ?? null}
        bearing={nav.bearing}
        onBearingChange={nav.handleBearingChange}
        heading={nav.heading}
        navMode={!!nav.navShop}
        overlayOpen={overlayOpen}
        routePlanTrip={routePlan.trip}
      />

      {(nav.locState === "denied" || nav.locState === "insecure") && (
        <LocationErrorBanner
          state={nav.locState}
          visible={nav.locMsgVisible}
          onDismiss={() => nav.setLocMsgVisible(false)}
          panelWidthClass={PANEL_WIDTH_CLASS}
        />
      )}

      {routePlan.geoError && (
        <LocationErrorBanner
          state={routePlan.geoError}
          visible={true}
          onDismiss={routePlan.dismissGeoError}
          panelWidthClass={PANEL_WIDTH_CLASS}
        />
      )}

      {!nav.navShop && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-[2200] p-3 ${PANEL_WIDTH_CLASS}`}
        >
          <DaySelector
            day={day}
            onDayChange={setDay}
            customers={apiCustomers}
            isLoading={isLoadingCustomers}
          />
          <DetermineRouteButton
            hasTrip={!!routePlan.trip}
            loading={routePlan.state === "loading"}
            disabled={dayShops.length === 0}
            onDetermine={handleDetermineRoute}
            onShowRoute={() => setRoutePlanDrawerOpen(true)}
            onClearRoute={() => {
              routePlan.clearPlan();
              setRoutePlanDrawerOpen(false);
            }}
          />
        </div>
      )}

      <MapFloatingActions
        visible={!nav.navShop && !addOpen && !picking}
        floatingBottom={floatingBottom}
        onLocate={nav.locate}
        onStartPicking={() => {
          setPicking(true);
          setAddOpen(false);
          setListOpen(false);
        }}
      />

      <LocationPickingBanner
        visible={picking}
        editingName={null}
        panelWidthClass={PANEL_WIDTH_CLASS}
        onCancel={() => {
          setPicking(false);
          setAddOpen(true);
        }}
      />

      <ShopListToggleButton
        visible={!nav.navShop && !listOpen && !addOpen && !picking}
        dayLabel={DAYS.find((d) => d.key === day)?.label ?? ""}
        count={dayShops.length}
        isLoading={isLoadingCustomers}
        panelWidthClass={PANEL_WIDTH_CLASS}
        onOpen={() => setListOpen(true)}
      />

      <ShopListDrawer
        open={!nav.navShop && listOpen}
        onOpenChange={setListOpen}
        day={day}
        items={listItems}
        selectedId={null}
        origin={nav.origin}
        onSelectItem={openListItem}
        isLoading={isLoadingCustomers}
        bottomNavHeight={BOTTOM_NAV_H_CSS}
        panelWidthClass={PANEL_WIDTH_CLASS}
        overlayZ={OVERLAY_Z}
      />

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

      <RoutePlanDrawer
        open={!nav.navShop && !!routePlan.trip && routePlanDrawerOpen}
        onOpenChange={setRoutePlanDrawerOpen}
        trip={routePlan.trip}
        onViewStop={(customerId) => router.push(`/stores/detail?id=${customerId}`)}
        bottomNavHeight={BOTTOM_NAV_H_CSS}
        panelWidthClass={PANEL_WIDTH_CLASS}
        overlayZ={OVERLAY_Z}
      />

      {nav.navShop && (
        <NavigationPanel
          shop={nav.navShop}
          origin={nav.origin}
          route={nav.route}
          routeLoading={nav.routeLoading}
          routeError={nav.routeError}
          remaining={nav.remaining}
          follow={nav.follow}
          onStopNavigation={nav.stopNavigation}
          onCenterOnUser={nav.centerOnUser}
          panelWidthClass={PANEL_WIDTH_CLASS}
          bottomNavHeight={BOTTOM_NAV_H_CSS}
        />
      )}
    </main>
  );
}

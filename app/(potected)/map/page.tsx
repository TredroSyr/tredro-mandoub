"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useGetCustomersQuery,
  useUpdateCustomerMutation,
} from "@/module/customers/hooks";
import {
  customersToShops,
  customersToListItems,
  filterCustomersByDay,
  CustomerListItem,
} from "@/module/customers/lib/utils";
import { DayKey, DAYS } from "@/module/map/lib/tour-data";
import { getCurrentPosition } from "@/module/map/lib/geo";
import { useMapFocus } from "@/module/map/lib/use-map-focus";
import { useTourNavigation } from "@/module/map/lib/use-tour-navigation";
import { TourMap } from "@/module/map/components/tour-map";
import { DaySelector } from "@/module/map/components/day-selector";
import { ShopListDrawer } from "@/module/map/components/shop-list-drawer";
import { CustomerDetailDrawer } from "@/module/map/components/customer-detail-drawer";
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

function todayKey(): DayKey {
  const map: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "sat", "sat"];
  return map[new Date().getDay()] ?? "sun";
}

export default function TourPage() {
  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery();
  const apiCustomers = customersData?.data?.customers ?? [];

  // For map display - only customers with coordinates
  const shops = useMemo(() => customersToShops(apiCustomers), [apiCustomers]);

  // For lists - ALL customers including those without coordinates
  const listItems = useMemo(
    () => customersToListItems(apiCustomers),
    [apiCustomers],
  );

  const [day, setDay] = useState<DayKey>(todayKey());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickingForEdit, setPickingForEdit] =
    useState<CustomerListItem | null>(null);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(
    null,
  );
  const [pickingLocLoading, setPickingLocLoading] = useState(false);

  const { focus, flyTo } = useMapFocus();
  const nav = useTourNavigation({ flyTo });

  const dayShops = useMemo(
    () => customersToShops(filterCustomersByDay(apiCustomers, day)),
    [apiCustomers, day],
  );
  const selected = shops.find((s) => s.id === selectedId) ?? null;
  const selectedListItem =
    listItems.find((item) => item.id === selectedId) ?? null;
  const overlayOpen =
    addOpen || !!selected || !!selectedListItem || listOpen || !!pickingForEdit;

  const updateCustomerLocMutation = useUpdateCustomerMutation();

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

  useEffect(() => {
    setSelectedId(null);
  }, [day]);

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
  const floatingBottom = listOpen ? `calc(46svh + 0.7rem)` : `0rem`;

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
              },
            );
          } else {
            // Add new customer
            setPickedPoint([lat, lng]);
            setPicking(false);
            setAddOpen(true);
          }
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
      />

      {(nav.locState === "denied" || nav.locState === "insecure") && (
        <LocationErrorBanner
          state={nav.locState}
          visible={nav.locMsgVisible}
          onDismiss={() => nav.setLocMsgVisible(false)}
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
        editingName={pickingForEdit?.name ?? null}
        panelWidthClass={PANEL_WIDTH_CLASS}
        onCancel={() => {
          setPicking(false);
          setPickingForEdit(null);
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
        selectedId={selectedId}
        origin={nav.origin}
        onSelectItem={openListItem}
        isLoading={isLoadingCustomers}
        bottomNavHeight={BOTTOM_NAV_H_CSS}
        panelWidthClass={PANEL_WIDTH_CLASS}
        overlayZ={OVERLAY_Z}
      />

      <CustomerDetailDrawer
        open={!!selectedListItem && !nav.navShop}
        onOpenChange={(open) => !open && setSelectedId(null)}
        item={selectedListItem}
        origin={nav.origin}
        onStartNavigation={nav.startNavigation}
        onEditLocation={(item) => {
          setSelectedId(null);
          setPicking(true);
          setPickingForEdit(item);
        }}
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

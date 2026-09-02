"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { AddCustomerDrawer } from "@/module/map/components/add-customer-drawer";
import {
  getCurrentPosition,
  GeoInsecureContextError,
  GeoPermissionError,
} from "@/module/map/lib/geo";
import { getGovernorateCenter } from "@/module/map/lib/tour-data";
import { useAuthStore } from "@/module/auth/store/auth-store";
import type { Customer } from "@/module/customers/types";
import { LocationPickerDialog } from "./location-picker-dialog";

export interface StoreEditCustomerDrawerProps {
  customer: Customer;
}

/** Reuses the map module's AddCustomerDrawer (in edit mode) so store details and the tour map share one customer form. */
export function StoreEditCustomerDrawer({ customer }: StoreEditCustomerDrawerProps) {
  const governorate = useAuthStore((s) => s.rep?.company?.governorate);
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(
    customer.latitude != null && customer.longitude != null
      ? [customer.latitude, customer.longitude]
      : null,
  );
  const [locLoading, setLocLoading] = useState(false);

  const openEdit = () => {
    setPickedPoint(
      customer.latitude != null && customer.longitude != null
        ? [customer.latitude, customer.longitude]
        : null,
    );
    setOpen(true);
  };

  const useMyLocation = useCallback(() => {
    setLocLoading(true);
    getCurrentPosition()
      .then((pos) => setPickedPoint(pos))
      .catch((error: unknown) => {
        if (error instanceof GeoPermissionError) {
          toast.error("يُرجى السماح بالوصول إلى الموقع لتحديد موقع المحل.");
        } else if (error instanceof GeoInsecureContextError) {
          toast.error("تحديد الموقع متاح فقط عبر اتصال آمن (HTTPS).");
        } else {
          toast.error("تعذّر تحديد الموقع الحالي. يُرجى المحاولة مرة أخرى.");
        }
      })
      .finally(() => setLocLoading(false));
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className="shrink-0"
        onClick={openEdit}
        aria-label="تعديل بيانات المحل"
      >
        <IconRenderer name="edit_outlined" className="w-3.5 h-3.5" />
      </Button>

      <AddCustomerDrawer
        open={open}
        onOpenChange={setOpen}
        customer={customer}
        pickedPoint={pickedPoint}
        onPickLocation={() => setPickerOpen(true)}
        onUseMyLocation={useMyLocation}
        isLoadingLocation={locLoading}
        onSuccess={() => setOpen(false)}
      />

      {pickerOpen && (
        <LocationPickerDialog
          open={pickerOpen}
          onOpenChange={(next) => {
            setPickerOpen(next);
            if (!next) setOpen(true);
          }}
          initialPoint={pickedPoint ?? getGovernorateCenter(governorate)}
          onConfirm={(lat, lng) => setPickedPoint([lat, lng])}
        />
      )}
    </>
  );
}

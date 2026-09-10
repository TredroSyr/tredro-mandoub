"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";
import type { Customer } from "@/module/customers/types";
import { CustomerForm } from "./customer-form";

const CUSTOMER_FORM_ID = "add-customer-drawer-form";

interface AddCustomerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the drawer edits this customer instead of creating a new one. */
  customer?: Customer;
  pickedPoint: [number, number] | null;
  onPickLocation: () => void;
  onUseMyLocation: () => void;
  isLoadingLocation: boolean;
  onSuccess: () => void;
}

export function AddCustomerDrawer({
  open,
  onOpenChange,
  customer,
  pickedPoint,
  onPickLocation,
  onUseMyLocation,
  isLoadingLocation,
  onSuccess,
}: AddCustomerDrawerProps) {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex justify-between flex-row w-full items-center gap-3 px-5 text-start">
          <DrawerTitle className="truncate text-base">
            {customer ? "تعديل بيانات المحل" : "محل جديد"}
          </DrawerTitle>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              form={CUSTOMER_FORM_ID}
              size="sm"
              disabled={isSaving}
            >
              <IconRenderer
                name={isSaving ? "activity_log_outlined" : "tick_outlined"}
                className={cn("w-3.5 h-3.5", isSaving && "animate-spin")}
              />
              {isSaving ? "جاري الحفظ…" : "حفظ"}
            </Button>
            <DrawerClose>
              <Button variant="secondary" size="icon-sm">
                <IconRenderer name="close_outlined" className="w-3 h-3" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <CustomerForm
            formId={CUSTOMER_FORM_ID}
            customer={customer}
            pickedPoint={pickedPoint}
            onPickLocation={() => {
              onOpenChange(false);
              onPickLocation();
            }}
            onUseMyLocation={onUseMyLocation}
            isLoadingLocation={isLoadingLocation}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
            onPendingChange={setIsSaving}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

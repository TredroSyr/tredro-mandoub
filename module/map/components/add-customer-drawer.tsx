"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { Customer } from "@/module/customers/types";
import { CustomerForm } from "./customer-form";

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
  bottomNavHeight?: string;
  panelWidthClass?: string;
  overlayZ?: string;
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
  bottomNavHeight = "var(--bottom-nav-height)",
  panelWidthClass = "md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2",
  overlayZ = "z-[2600]",
}: AddCustomerDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={`${overlayZ} mt-0 h-[75svh] rounded-t-[1.75rem] border-t border-glass-border bg-card/95 shadow-sheet backdrop-blur-xl ${panelWidthClass} md:rounded-b-[1.75rem]`}
        style={{ bottom: bottomNavHeight }}
      >
        <DrawerHeader className="flex justify-between flex-row w-full items-center gap-3 px-5 pb-3 pt-1 text-start">
          <DrawerTitle className="truncate text-base">
            {customer ? "تعديل بيانات المحل" : "محل جديد"}
          </DrawerTitle>
          <DrawerClose>
            <Button variant="secondary" size="icon-sm">
              <IconRenderer name="close_outlined" className="w-3 h-3" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <CustomerForm
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
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

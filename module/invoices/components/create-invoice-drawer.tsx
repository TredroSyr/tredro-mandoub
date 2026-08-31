"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreateInvoiceForm, InvoiceRequestPrefill } from "./create-invoice-form";

export function CreateInvoiceDrawer({
  open,
  onOpenChange,
  customerId,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  prefill?: InvoiceRequestPrefill;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={isMobile ? "down" : "left"}>
      <DrawerContent className="flex h-[92dvh] max-h-[92dvh] w-full flex-col rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl">
        <DrawerHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-3 border-b border-border bg-background px-4 pb-3 pt-6 sm:px-6 sm:pt-4">
          <DrawerTitle className="text-right text-base sm:text-lg">
            {prefill ? "إنشاء فاتورة وتسليم الطلب" : "فاتورة جديدة"}
          </DrawerTitle>
          <DrawerClose>
            <Button type="button" variant="outline" size="sm">
              إغلاق
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8 sm:px-6 sm:pb-6">
          <CreateInvoiceForm customerId={customerId} prefill={prefill} onSuccess={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

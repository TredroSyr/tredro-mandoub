"use client";

import { useRef, useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { NAV_H } from "@/layout/bottom-nav";
import { CreateInvoiceForm, CreateInvoiceFormHandle, CreateInvoiceFormState, InvoiceRequestPrefill } from "./create-invoice-form";

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
  const formRef = useRef<CreateInvoiceFormHandle>(null);
  const [formState, setFormState] = useState<CreateInvoiceFormState>({ canSubmit: false, isPending: false });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={isMobile ? "down" : "left"}>
      <DrawerContent
        className="flex h-[92dvh] max-h-[92dvh] w-full flex-col rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl"
        style={isMobile ? { bottom: NAV_H } : undefined}
      >
        <DrawerHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-3 border-b border-border bg-background px-4 pb-3 pt-6 sm:px-6 sm:pt-4">
          <DrawerTitle className="text-right text-base sm:text-lg">
            {prefill ? "إنشاء فاتورة وتسليم الطلب" : "فاتورة جديدة"}
          </DrawerTitle>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!formState.canSubmit || formState.isPending}
              onClick={() => formRef.current?.submit()}
            >
              <IconRenderer name="checkout_outlined" className="size-3.5" />
              {formState.isPending ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
            <DrawerClose>
              <Button type="button" variant="outline" size="sm">
                إغلاق
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8 sm:px-6 sm:pb-6">
          <CreateInvoiceForm
            ref={formRef}
            customerId={customerId}
            prefill={prefill}
            onSuccess={() => onOpenChange(false)}
            onStateChange={setFormState}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

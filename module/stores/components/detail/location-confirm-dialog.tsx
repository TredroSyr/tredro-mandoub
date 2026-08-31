"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationPickerMap } from "./location-picker-map";
import { useUpdateCustomerMutation } from "@/module/customers/hooks";

export interface LocationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  initialPoint: [number, number];
}

/** Mounted by the caller only while a fresh GPS reading is pending confirmation, so `point` never needs to be re-synced from a later `initialPoint`. */
export function LocationConfirmDialog({
  open,
  onOpenChange,
  customerId,
  initialPoint,
}: LocationConfirmDialogProps) {
  const [point, setPoint] = useState(initialPoint);

  const updateCustomerMutation = useUpdateCustomerMutation({
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تأكيد موقع المحل</DialogTitle>
        </DialogHeader>

        <LocationPickerMap point={point} onPick={(lat, lng) => setPoint([lat, lng])} />

        <p className="text-center font-mono text-[11px] text-muted-foreground">
          {point[0].toFixed(5)}, {point[1].toFixed(5)}
        </p>
        <p className="text-center text-[11px] text-muted-foreground">اضغط في أي مكان على الخريطة لتعديل الموقع.</p>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={() =>
              updateCustomerMutation.mutate({
                customerId,
                data: {
                  latitude: Number(point[0].toFixed(6)),
                  longitude: Number(point[1].toFixed(6)),
                },
              })
            }
            disabled={updateCustomerMutation.isPending}
          >
            تأكيد الموقع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationPickerMap } from "./location-picker-map";

export interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPoint: [number, number];
  onConfirm: (lat: number, lng: number) => void;
}

/** Lets the caller pick a point on an embedded map and hands it back via onConfirm, without mutating anything itself. */
export function LocationPickerDialog({
  open,
  onOpenChange,
  initialPoint,
  onConfirm,
}: LocationPickerDialogProps) {
  const [point, setPoint] = useState(initialPoint);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تحديد موقع المحل</DialogTitle>
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
            onClick={() => {
              onConfirm(point[0], point[1]);
              onOpenChange(false);
            }}
          >
            تأكيد الموقع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

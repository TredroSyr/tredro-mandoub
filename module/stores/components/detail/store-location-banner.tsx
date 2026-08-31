"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  getCurrentPosition,
  GeoInsecureContextError,
  GeoPermissionError,
} from "@/module/map/lib/geo";
import { ALEPPO_CENTER } from "@/module/map/lib/tour-data";
import { LocationConfirmDialog } from "./location-confirm-dialog";

export function StoreLocationBanner({ customerId }: { customerId: number }) {
  const [isLocating, setIsLocating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [confirmPoint, setConfirmPoint] = useState<[number, number] | null>(null);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    getCurrentPosition()
      .then((point) => {
        setChoiceOpen(false);
        setConfirmPoint(point);
      })
      .catch((error: unknown) => {
        if (error instanceof GeoPermissionError) {
          toast.error("يُرجى السماح بالوصول إلى الموقع لتحديد موقع المحل.");
        } else if (error instanceof GeoInsecureContextError) {
          toast.error("تحديد الموقع متاح فقط عبر اتصال آمن (HTTPS).");
        } else {
          toast.error("تعذّر تحديد الموقع الحالي. يُرجى المحاولة مرة أخرى.");
        }
      })
      .finally(() => setIsLocating(false));
  };

  const handlePickOnMap = () => {
    setChoiceOpen(false);
    setConfirmPoint(ALEPPO_CENTER);
  };

  if (dismissed) return null;

  return (
    <>
      <div className="warning-banner mt-3 flex items-center gap-2 rounded-2xl p-2.5">
        <IconRenderer name="unpin_outlined" className="h-4 w-4 shrink-0 text-warning" />
        <p className="min-w-0 flex-1 truncate text-xs font-bold text-warning-foreground">
          هذا المتجر بدون موقع على الخريطة
        </p>
        <Button
          type="button"
          size="sm"
          variant="warning"
          className="shrink-0"
          onClick={() => setChoiceOpen(true)}
        >
          <LocateFixed className="w-4 h-4" />
          تحديد الموقع
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إغلاق"
          className="shrink-0 text-warning-foreground/60"
        >
          <IconRenderer name="close_outlined" className="w-4 h-4" />
        </button>
      </div>

      <Dialog open={choiceOpen} onOpenChange={(open) => !isLocating && setChoiceOpen(open)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تحديد موقع المحل</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">اختر طريقة تحديد موقع المحل على الخريطة.</p>

          <DialogFooter className="sm:flex-col">
            <Button type="button" onClick={handleUseCurrentLocation} disabled={isLocating}>
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              {isLocating ? "جاري تحديد موقعي…" : "استخدام موقعي الحالي"}
            </Button>
            <Button type="button" variant="secondary" onClick={handlePickOnMap} disabled={isLocating}>
              <MapPin className="w-4 h-4" />
              تحديد يدويًا على الخريطة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmPoint && (
        <LocationConfirmDialog
          open={!!confirmPoint}
          onOpenChange={(open) => !open && setConfirmPoint(null)}
          customerId={customerId}
          initialPoint={confirmPoint}
        />
      )}
    </>
  );
}

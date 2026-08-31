"use client";

import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";

interface LocationPickingBannerProps {
  visible: boolean;
  editingName: string | null;
  onCancel: () => void;
  panelWidthClass: string;
}

/** Prompt shown while the rep is tapping the map to place a new or edited customer pin. */
export function LocationPickingBanner({
  visible,
  editingName,
  onCancel,
  panelWidthClass,
}: LocationPickingBannerProps) {
  if (!visible) return null;

  return (
    <div
      className={`absolute inset-x-3 z-[2200] glass-panel flex items-center gap-3 rounded-3xl p-3 shadow-float ${panelWidthClass}`}
      style={{ bottom: "1rem" }}
    >
      <IconRenderer
        name="pin_outlined"
        className={`w-7 h-7 shrink-0 ${editingName ? "text-warning" : "text-primary"}`}
      />
      <p className="min-w-0 flex-1 text-xs font-bold">
        {editingName
          ? `اضغط على الخريطة لتحديد موقع: ${editingName}`
          : "اضغط على الخريطة لتحديد موقع المحل الجديد"}
      </p>
      <Button
        onClick={onCancel}
        variant="secondary"
        size="sm"
        className="shrink-0 rounded-xl"
      >
        إلغاء
      </Button>
    </div>
  );
}

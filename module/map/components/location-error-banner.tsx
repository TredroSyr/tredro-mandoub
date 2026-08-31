"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";

const LOCATION_ERROR_MESSAGES: Record<"denied" | "insecure", string> = {
  denied:
    "لم تمنحنا صلاحية الوصول لموقعك. يرجى تفعيلها من إعدادات المتصفح أو التطبيق.",
  insecure:
    "يتطلب تحديد الموقع اتصالاً آمناً (https). يرجى فتح الموقع عبر رابط https:// والمحاولة مرة أخرى.",
};

interface LocationErrorBannerProps {
  state: "denied" | "insecure";
  visible: boolean;
  onDismiss: () => void;
  panelWidthClass: string;
}

export function LocationErrorBanner({
  state,
  visible,
  onDismiss,
  panelWidthClass,
}: LocationErrorBannerProps) {
  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-x-3 top-3 z-[2100] flex justify-center ${panelWidthClass}`}
    >
      <div className="pointer-events-auto glass-panel flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-float">
        <IconRenderer
          name="warning_outlined"
          className="w-5 h-5 shrink-0 text-warning-foreground"
        />
        <span className="min-w-0">{LOCATION_ERROR_MESSAGES[state]}</span>
        <button
          onClick={onDismiss}
          aria-label="إغلاق"
          className="shrink-0 opacity-60"
        >
          <IconRenderer name="close_outlined" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

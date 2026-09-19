"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useNetworkStatus } from "@/hooks/use-network-status";

/**
 * A persistent strip, not a toast — a rep needs to know they're offline for
 * as long as they are, not just for the few seconds a toast is visible.
 * Renders above the header/nav so it's visible on every screen, including
 * the full-screen map.
 */
export function OfflineBanner() {
  const { connected } = useNetworkStatus();

  if (connected) return null;

  return (
    <div
      role="status"
      dir="rtl"
      className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-center text-xs font-bold text-destructive"
    >
      <IconRenderer name="warning_outlined" className="size-3.5 shrink-0" />
      <span>لا يوجد اتصال بالإنترنت — إجراءاتك ستُحفظ وتُزامَن عند عودة الاتصال</span>
    </div>
  );
}

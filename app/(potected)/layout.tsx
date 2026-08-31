"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/guards/protected-route";
import BottomNav, { NAV_H } from "@/layout/bottom-nav";
import AppHeader from "@/components/layout/app-header";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = pathname?.startsWith("/map") ?? false;

  return (
    <ProtectedRoute>
      <div style={{ paddingBottom: NAV_H }} className="min-h-dvh bg-background">
        {!isFullScreen && <AppHeader />}
        {isFullScreen ? children : <main className="mx-auto max-w-md px-4 py-4">{children}</main>}
      </div>
      <BottomNav />
    </ProtectedRoute>
  );
}

import { ProtectedRoute } from "@/guards/protected-route";
import BottomNav, { NAV_H } from "@/layout/bottom-nav";
import type { ReactNode } from "react";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ paddingBottom: NAV_H }} className="min-h-dvh bg-background">
        {children}
      </div>
      <BottomNav />
    </>
  );
}

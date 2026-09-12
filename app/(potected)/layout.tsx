"use client";

import { useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/guards/protected-route";
import BottomNav, { NAV_H } from "@/layout/bottom-nav";
import AppHeader from "@/components/layout/app-header";
import { PullToRefresh } from "@/components/tredro/pull-to-refresh";
import { useAuthInit } from "@/module/auth/hook/use-token-guard";
import { useRegisterPushNotifications } from "@/module/notifications/hooks/use-register-push-notifications";
import UpdateChecker from "@/components/tredro/UpdateChecker";

const MIN_SPIN_MS = 500;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthInit();
  useRegisterPushNotifications(isAuthenticated);

  const pathname = usePathname();
  const isFullScreen = pathname?.startsWith("/map") ?? false;
  // Notifications lays out its own edge-to-edge sticky bar and list, so it
  // opts out of the shared main padding instead of fighting it.
  const hasOwnPadding = pathname?.startsWith("/notifications") ?? false;
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    const startedAt = Date.now();
    await queryClient.refetchQueries({ type: "active" });
    const remaining = MIN_SPIN_MS - (Date.now() - startedAt);
    if (remaining > 0)
      await new Promise((resolve) => setTimeout(resolve, remaining));
  }, [queryClient]);

  return (
    <ProtectedRoute>
      <UpdateChecker />
      <div style={{ paddingBottom: NAV_H }} className="min-h-dvh bg-background">
        {!isFullScreen && <AppHeader />}
        {isFullScreen ? (
          children
        ) : (
          <main
            className={cn(
              "mx-auto max-w-md",
              !hasOwnPadding && "px-4 py-4",
            )}
          >
            <PullToRefresh onRefresh={handleRefresh}>{children}</PullToRefresh>
          </main>
        )}
      </div>
      <BottomNav />
    </ProtectedRoute>
  );
}

"use client";

import { useAuthStore } from "@/module/auth/store/auth-store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * What the static export ships as the page's HTML, and what shows until the JS
 * has hydrated. Mirrors the real header / bottom bar (same sizes) so they are
 * on screen from the first paint instead of the whole app popping in at once.
 */
function AppShellSplash() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-glass-border bg-glass px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3" dir="ltr">
          <div className="size-9 shrink-0 rounded-2xl bg-secondary" />
          <Image
            src="/tredro/full_logo.svg"
            alt="Tredro Logo"
            width={140}
            height={70}
            priority
            className="h-auto w-[140px] object-contain"
          />
          <div className="size-9 shrink-0 rounded-2xl bg-primary/12" />
        </div>
      </header>
      <nav dir="rtl" className="fixed inset-x-0 bottom-0 z-40 pt-1.5" aria-hidden>
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 bg-card px-1.5 py-3 shadow-(--bottom-nav-shadow)">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-11 w-11 items-center justify-center">
              <div className="size-5 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
  }, [isMounted, isAuthenticated, router, user]);

  if (!isMounted) return <AppShellSplash />;
  // Redirecting to login — keep the shell up instead of flashing a blank screen.
  if (!isAuthenticated) return <AppShellSplash />;

  return <>{children}</>;
};

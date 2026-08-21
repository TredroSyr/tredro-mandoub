"use client";

import { useAuthStore } from "@/module/auth/store/auth-store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
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

  if (!isMounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Image
          src="/tredro/full_logo.svg"
          alt="Tredro Logo"
          width={160}
          height={80}
          className="animate-pulse"
        />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return <>{children}</>;
};

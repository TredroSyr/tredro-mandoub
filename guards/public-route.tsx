"use client";

import { useAuthStore } from "@/module/auth/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const router = useRouter();
  const user = useAuthStore();
  console.log({ user });
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const isProfileCompleted = useAuthStore(
    (state) => !!state.user?.company.onboarding_completed,
  );
  const [isMounted, setIsMounted] = useState<boolean>(false);
  console.log({ isProfileCompleted });
  useEffect(() => {
    setIsMounted(true);

    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated && isProfileCompleted && isMounted) {
      router.push("/");
    }
  }, [isAuthenticated, isMounted, router, isProfileCompleted]);

  if (!isMounted) {
    return null;
  }

  if (isAuthenticated && isProfileCompleted) {
    return null;
  }

  return <>{children}</>;
};

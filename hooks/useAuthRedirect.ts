"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const accessToken = getCookie("access_token");

    if (accessToken) {
      router.replace("/home");
    } else {
      router.replace("/auth/login");
    }
  }, [router]);
}

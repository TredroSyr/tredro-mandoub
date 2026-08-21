// hooks/useAuthInit.ts
import { useState, useEffect, useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAuthStore } from "../store/auth-store";
import { clearAuthTokens, refreshAccessToken } from "../lib/auth";
import { getTokenRemainingTime, isTokenExpired } from "../lib/token";

export const useAuthInit = () => {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPending, setIsPending] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = useCallback(() => {
    console.log("🔀 Session invalid, logging out...");
    clearAuth();
    queryClient.clear();
    clearAuthTokens();
    router.push("/auth/login");
  }, [clearAuth, queryClient, router]);

  const validateAndRefreshSession = useCallback(async () => {
    try {
      const { accessToken, refreshToken } = useAuthStore.getState();

      const currentRefreshToken = refreshToken;
      if (!currentRefreshToken || isTokenExpired(currentRefreshToken)) {
        console.warn("⚠️ Refresh token missing or expired");
        handleLogout();
        return false;
      }

      const currentAccessToken = accessToken;

      if (!currentAccessToken) {
        console.log("🔄 Access token missing, refreshing...");
        const refreshResult = await refreshAccessToken();

        if (!refreshResult.ok) {
          if (refreshResult.reason === "network") {
            console.warn(
              "⚠️ Refresh failed (network) — keeping session, will retry",
            );
            setIsAuthenticated(true);
            return true;
          }

          console.error("❌ Session refresh failed:", refreshResult.reason);
          handleLogout();
          return false;
        }

        setIsAuthenticated(true);
        return true;
      }

      if (getTokenRemainingTime(currentAccessToken) <= 0) {
        console.log("🔄 Access token expired, refreshing...");
        const refreshResult = await refreshAccessToken();

        if (!refreshResult.ok) {
          if (refreshResult.reason === "network") {
            console.warn(
              "⚠️ Refresh failed (network) — keeping session, will retry",
            );
            setIsAuthenticated(true);
            return true;
          }

          console.error("❌ Session refresh failed:", refreshResult.reason);
          handleLogout();
          return false;
        }
      } else if (isTokenExpired(currentAccessToken)) {
        void refreshAccessToken();
      }

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("❌ Auth validation error:", error);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      const isValid = await validateAndRefreshSession();
      if (!isMounted) return;

      if (isValid) {
        // Periodically check session (every 2 minutes)
        // Note: The interceptor handles on-demand refresh, but this ensures
        // the session stays alive during periods of inactivity.
        intervalId = setInterval(() => {
          if (isMounted) validateAndRefreshSession();
        }, 2 * 60 * 1000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMounted) {
        validateAndRefreshSession();
      }
    };

    initializeAuth();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [validateAndRefreshSession]);

  return {
    isPending,
    isAuthenticated,
    refresh: validateAndRefreshSession,
  };
};

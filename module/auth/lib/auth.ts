import axios from "axios";

import { useAuthStore } from "../store/auth-store";
import { requestNewAccessToken } from "../hook/refresh-token";

// Why a refresh failed. Callers must only log the user out on 'invalid' /
// 'no-refresh-token' — 'network' means we simply couldn't reach the server
// (offline, DNS, 5xx) and the refresh token may still be perfectly valid.
export type RefreshOutcome =
  | { ok: true; token: string }
  | { ok: false; reason: "no-refresh-token" | "invalid" | "network" };

// Dedupes concurrent refresh calls — if multiple requests trigger a refresh
// at the same time, they all await the same in-flight promise instead of
// firing multiple refresh requests.
let refreshPromise: Promise<RefreshOutcome> | null = null;

export const refreshAccessToken = async (): Promise<RefreshOutcome> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<RefreshOutcome> => {
    // Refresh token now lives only in the Zustand store (persisted to localStorage)
    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      console.warn("⚠️ No refresh token available");
      return { ok: false, reason: "no-refresh-token" };
    }

    try {
      console.log("🔄 Refreshing access token...");

      // Shared with the middleware — single source of truth for the refresh call.
      const result = await requestNewAccessToken(refreshToken);

      if (!result.ok) {
        console.error("❌ Token refresh failed:", { status: result.status });

        if (result.status === 401 || result.status === 403) {
          console.log("🗑️ Refresh token invalid, clearing auth state");

          useAuthStore.getState().clearAuth();
          return { ok: false, reason: "invalid" };
        }

        // status === null (offline / fetch threw) or a 5xx — server unreachable
        // or misbehaving. Keep the session; the caller can retry later.
        return { ok: false, reason: "network" };
      }

      const { access } = result;

      // Update Zustand store (this is now the only place the token lives)
      useAuthStore.getState().setAccessToken(access);

      console.log("✅ Access token refreshed and synced");
      return { ok: true, token: access };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const logout = async (): Promise<void> => {
  try {
    // Read refresh token straight from the store instead of a cookie
    const refreshToken = useAuthStore.getState().refreshToken;

    if (refreshToken) {
      console.log("📤 Sending logout request...");

      await axios
        .post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signout`,
          { refresh: refreshToken },
          {
            timeout: 5000,
            headers: { "Content-Type": "application/json" },
          },
        )
        .catch((error) => {
          // Logout call failing shouldn't block clearing local auth state
          console.warn("⚠️ Logout request failed (ignored):", error.message);
        });
    }
  } finally {
    console.log("🗑️ Clearing auth state...");

    // clearAuth() already resets the store; persist() middleware auto-syncs
    // that change to localStorage, so no manual localStorage.removeItem needed
    useAuthStore.getState().clearAuth();

    if (typeof window !== "undefined") {
      console.log("🔀 Redirecting to login...");
      window.location.href = "/auth/login";
    }
  }
};

export const setAuthTokens = (
  accessToken: string,
  refreshToken: string,
): void => {
  // Single call updates both tokens in the store (persist middleware
  // handles writing to localStorage automatically)
  useAuthStore.getState().setAccessToken(accessToken);
  useAuthStore.getState().setRefreshToken(refreshToken);

  console.log("✅ Auth tokens saved and synced");
};

export const clearAuthTokens = (): void => {
  // clearAuth() resets accessToken, refreshToken, user, isAuthenticated
  // and persist() automatically writes the cleared state to localStorage
  useAuthStore.getState().clearAuth();

  console.log("🗑️ Auth tokens cleared");
};

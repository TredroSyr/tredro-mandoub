// lib/auth/refresh-token.ts
//
// Edge-compatible core token refresh. Uses only `fetch` + `process.env`, so the
// exact same request logic runs in the browser (lib/helpers/auth.ts) AND in the
// Edge middleware (middleware.ts). Keep this file free of axios / js-cookie /
// zustand so it can be imported from the Edge runtime.

import { fetchWithTimeout } from "../lib/fetch-with-timeout";

const AUTH_API_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

export type RefreshResult =
  | { ok: true; access: string }
  | { ok: false; status: number | null };

/**
 * Calls the auth refresh endpoint with the given refresh token.
 * Pure HTTP — does NOT touch cookies or any store, so the caller decides how to
 * persist the result (client cookie/store vs. middleware response cookie).
 *
 * @returns `{ ok: true, access }` on success, or `{ ok: false, status }` where
 *          `status` is the HTTP status (401/403 → refresh token is invalid) or
 *          `null` for network/parse errors.
 */
export const requestNewAccessToken = async (
  refreshToken: string,
): Promise<RefreshResult> => {
  if (!refreshToken) return { ok: false, status: null };

  try {
    const response = await fetchWithTimeout(
      `${AUTH_API_URL}/auth/token/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.log("🔴 [REFRESH] Refresh endpoint failed:", response.status);
      return { ok: false, status: response.status };
    }

    const result = await response.json();
    const access: string | undefined = result?.data?.access ?? result?.access;

    if (!access) {
      console.log("🔴 [REFRESH] No access token in refresh response");
      return { ok: false, status: response.status };
    }

    return { ok: true, access };
  } catch (error) {
    console.log("🔴 [REFRESH] Exception during refresh:", error);
    return { ok: false, status: null };
  }
};

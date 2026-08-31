import { logout, refreshAccessToken } from "@/module/auth/lib/auth";
import { useAuthStore } from "@/module/auth/store/auth-store";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

// Shape of a request that failed with 401 and is waiting in the queue
// while a token refresh is in progress.
type FailedRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
};

// URLs that should NEVER trigger the refresh-token flow,
// even if they return 401 (e.g. login/signup/refresh endpoints themselves).
const AUTH_SKIP_URLS = [
  "/auth/company/signup",
  "/auth/token/refresh",
  "/auth/company/signin",
];

// Global flag: true while a refresh request is in flight.
// Prevents multiple simultaneous refresh calls.
let isRefreshing = false;

// Queue of requests that failed with 401 while a refresh was already happening.
// They get retried once the new token is ready.
let failedRequestQueue: FailedRequest[] = [];

// Requests that are *about to be sent* while a refresh is already in flight.
// Held here (instead of going out with a token we already know is stale) and
// released once the refresh settles, so they pick up the new token instead of
// making a doomed round trip and having to be retried after their own 401.
let pendingRequestQueue: Array<() => void> = [];

const releasePendingRequests = () => {
  pendingRequestQueue.forEach((resolve) => resolve());
  pendingRequestQueue = [];
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR
// Runs before every request is sent.
// ---------------------------------------------------------------------------
api.interceptors.request.use(async (config) => {
  const isAuthUrl = AUTH_SKIP_URLS.some((u) => config.url?.includes(u));

  // A refresh is already in flight — hold this request instead of sending it
  // with a token we already know is stale. It'll be released (and picked up
  // with whatever token the refresh landed on) once that refresh settles.
  if (isRefreshing && !isAuthUrl) {
    await new Promise<void>((resolve) => {
      pendingRequestQueue.push(resolve);
    });
  }

  // Attach the access token to every outgoing request, if we have one.
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ---------------------------------------------------------------------------
// Helper: resolves or rejects all requests waiting in the queue.
// Called after a token refresh attempt finishes (success or failure).
// ---------------------------------------------------------------------------
const processQueue = (error: unknown, token: string | null = null) => {
  failedRequestQueue.forEach((prom) => {
    if (error) {
      // Refresh failed -> reject every queued request with the same error.
      prom.reject(error);
    } else if (token) {
      // Refresh succeeded -> update the header with the new token
      // and retry the original request.
      if (prom.config.headers) {
        prom.config.headers.Authorization = `Bearer ${token}`;
      }
      prom.resolve(api(prom.config));
    }
  });

  // Clear the queue once processed.
  failedRequestQueue = [];
};

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR
// Handles 401 errors by attempting a token refresh, then retrying.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If there's no config at all, we can't retry anything.
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Don't attempt refresh logic on auth endpoints themselves
    // (login, signup, refresh) to avoid infinite loops.
    const isAuthUrl = AUTH_SKIP_URLS.some((u) =>
      originalRequest.url?.includes(u),
    );
    const is401 = error.response?.status === 401;

    if (is401 && !originalRequest._retry && !isAuthUrl) {
      // Mark this request so we don't try to refresh for it again.
      originalRequest._retry = true;

      if (isRefreshing) {
        // A refresh is already happening — queue this request instead of
        // firing a second refresh call. It will be resolved/rejected
        // once the ongoing refresh finishes.
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;

      try {
        const refreshResult = await refreshAccessToken();

        if (refreshResult.ok) {
          // Update the header of the request that triggered the refresh.
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
          }

          // Retry all requests that piled up in the queue with the new token.
          processQueue(null, refreshResult.token);

          // Retry the original request that caused the 401.
          return api(originalRequest);
        } else {
          // Refresh endpoint responded, but refresh was not successful
          // (e.g. refresh token expired) — reject everything.
          processQueue(error);

          // Only a server-confirmed invalid/expired refresh token warrants a
          // full logout; a network blip or 5xx should keep the session alive
          // so the user can simply retry.
          if (refreshResult.reason !== "network") {
            void logout();
          }

          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh call itself threw (network error, etc.) — reject everything.
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        // Always release the lock so future 401s can trigger a new refresh.
        isRefreshing = false;
        // Let any requests held in the request interceptor proceed now.
        releasePendingRequests();
      }
    }

    // Any other error (not 401, already retried, or an auth URL) — just reject.
    return Promise.reject(error);
  },
);

export default api;

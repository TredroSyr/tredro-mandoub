import { refreshAccessToken } from "@/module/auth/lib/auth";
import { useAuthStore } from "@/module/auth/store/auth-store";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

const AUTH_SKIP_URLS = [
  "/auth/company/signup",
  "/auth/token/refresh",
  "/auth/company/signin",
];

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthUrl = AUTH_SKIP_URLS.some((u) =>
      originalRequest.url?.includes(u),
    );
    const is401 = error.response?.status === 401;

    if (is401 && !originalRequest._retry && !isAuthUrl) {
      originalRequest._retry = true;

      try {
        const refreshResult = await refreshAccessToken();

        if (refreshResult.ok) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

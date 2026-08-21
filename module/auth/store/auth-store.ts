// store/auth-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Rep, Tokens } from "../types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  rep: Rep | null;
  isAuthenticated: boolean;
  setAuth: (rep: Rep, tokens: Tokens) => void;
  setAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  updateRep: (rep: Partial<Rep>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      rep: null,
      isAuthenticated: false,

      setAuth: (rep, tokens) =>
        set({
          rep,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isAuthenticated: true,
        }),

      setAccessToken: (accessToken) =>
        set({ accessToken, isAuthenticated: true }),

      setRefreshToken: (refreshToken) => set({ refreshToken }),
      //trigger
      updateRep: (partial) =>
        set({
          rep: get().rep ? { ...get().rep!, ...partial } : null,
        }),

      clearAuth: () =>
        set({
          rep: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "tredro-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        rep: state.rep,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

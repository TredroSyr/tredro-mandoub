"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

type ThemeStore = {
  theme: Theme;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

declare global {
  interface Document {
    startViewTransition?: (callback: () => void) => {
      ready: Promise<void>;
      finished: Promise<void>;
      updateCallbackDone: Promise<void>;
    };
  }
}

const applyThemeClass = (theme: Theme) => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
};

const setTransitionOrigin = (theme: Theme) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (theme === "dark") {
    root.style.setProperty("--vt-origin-x", "0%");
    root.style.setProperty("--vt-origin-y", "0%");
  } else {
    root.style.setProperty("--vt-origin-x", "100%");
    root.style.setProperty("--vt-origin-y", "100%");
  }
};

const applyWithViewTransition = (theme: Theme, apply: () => void) => {
  if (typeof document === "undefined") {
    apply();
    return;
  }

  setTransitionOrigin(theme);

  if (!document.startViewTransition) {
    apply();
    return;
  }

  document.startViewTransition(apply);
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      toggleTheme: () => {
        const nextTheme: Theme = get().theme === "light" ? "dark" : "light";
        applyWithViewTransition(nextTheme, () => {
          applyThemeClass(nextTheme);
          set({ theme: nextTheme });
        });
      },
      setTheme: (theme) => {
        applyWithViewTransition(theme, () => {
          applyThemeClass(theme);
          set({ theme });
        });
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeClass(state.theme);
          state.setHasHydrated(true);
        }
      },
    },
  ),
);

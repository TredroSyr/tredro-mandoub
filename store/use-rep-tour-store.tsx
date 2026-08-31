"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  INITIAL_NOTIFICATIONS,
  INITIAL_SALES,
  type AppNotification,
  type Sale,
} from "@/lib/rep-tour-data";

type RepTourState = {
  sales: Sale[];
  notifications: AppNotification[];
  markNotificationsRead: () => void;
};

export const useRepTourStore = create<RepTourState>()(
  persist(
    (set, get) => ({
      sales: INITIAL_SALES,
      notifications: INITIAL_NOTIFICATIONS,

      markNotificationsRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
    }),
    { name: "tredro-rep-tour" },
  ),
);

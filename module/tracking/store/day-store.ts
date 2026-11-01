import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syriaDateKey } from "../lib/time";

/**
 * The rep's work day as this device knows it. The backend has no "current
 * day" read, so the app remembers what it sent (start / end go through the
 * tracking queue, which may still be waiting for a connection).
 */
export interface RepDay {
  repId: number;
  /** Syria-time YYYY-MM-DD the day was started on. */
  date: string;
  startedAt: string;
  endedAt: string | null;
}

interface DayState {
  day: RepDay | null;
  startDay: (day: Omit<RepDay, "endedAt">) => void;
  endDay: (endedAt: string) => void;
}

export const useRepDayStore = create<DayState>()(
  persist(
    (set) => ({
      day: null,
      startDay: (day) => set({ day: { ...day, endedAt: null } }),
      endDay: (endedAt) => set((s) => (s.day ? { day: { ...s.day, endedAt } } : s)),
    }),
    { name: "tredro_rep_day_v1" },
  ),
);

/**
 * Today's (or last night's still-open) day for this rep. A day older than
 * yesterday that was never ended is over — the server already ended it by
 * inactivity — so it reads as none.
 */
export function currentDay(day: RepDay | null, repId: number | undefined, now = Date.now()): RepDay | null {
  if (!day || repId == null || day.repId !== repId) return null;
  const today = syriaDateKey(now);
  const yesterday = syriaDateKey(now - 24 * 60 * 60 * 1000);
  if (day.date === today) return day;
  if (day.date === yesterday && !day.endedAt) return day;
  return null;
}

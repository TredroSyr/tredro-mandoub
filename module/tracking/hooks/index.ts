"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { OfflineQueuedError, QUEUED_MESSAGE } from "@/lib/sync/errors";
import { runOrQueue } from "@/lib/sync/queue-on-offline";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { ApiErrorResponse } from "@/module/auth/types";
import { createVisit, type CreateVisitPayload, type CreateVisitResponse } from "../api";
import { enqueueDayEvent } from "../lib/queue";
import { syriaDateKey, toOffsetIso } from "../lib/time";
import { getFixOnce, getRecentFix, recentCoords, type Fix } from "../lib/tracker";
import { currentDay, useRepDayStore } from "../store/day-store";

const coordsOf = (fix: Fix | null) =>
  fix ? { latitude: Number(fix.latitude.toFixed(6)), longitude: Number(fix.longitude.toFixed(6)) } : {};

/** The rep's day on this device, plus start / end actions. */
export function useRepDay() {
  const repId = useAuthStore((s) => s.rep?.id);
  const stored = useRepDayStore((s) => s.day);
  const day = currentDay(stored, repId);
  const [busy, setBusy] = useState<"start" | "end" | null>(null);

  const start = useCallback(async () => {
    if (repId == null) return;
    setBusy("start");
    try {
      // Where the day starts is the dashboard's depot pin; without a fix it just has none.
      const fix = await getFixOnce();
      const now = new Date();
      enqueueDayEvent("day_start", { at: toOffsetIso(now), ...coordsOf(fix) });
      useRepDayStore.getState().startDay({ repId, date: syriaDateKey(now.getTime()), startedAt: now.toISOString() });
      toast.success(fix ? "بدأ يوم العمل — موقعك يُرسل للشركة" : "بدأ يوم العمل — لم يُحدَّد موقعك بعد");
    } finally {
      setBusy(null);
    }
  }, [repId]);

  const end = useCallback(async () => {
    setBusy("end");
    try {
      const fix = getRecentFix(60_000) ?? (await getFixOnce(5_000));
      const now = new Date();
      enqueueDayEvent("day_end", { at: toOffsetIso(now), ...coordsOf(fix) });
      useRepDayStore.getState().endDay(now.toISOString());
      toast.success("انتهى يوم العمل — توقف إرسال موقعك");
    } finally {
      setBusy(null);
    }
  }, []);

  return { day, running: !!day && !day.endedAt, busy, start, end };
}

export const useCreateVisitMutation = (options?: { onDone?: () => void }) => {
  const { keyFor, reset } = useIdempotencyKey();
  return useMutation<CreateVisitResponse, AxiosError<ApiErrorResponse> | OfflineQueuedError, Omit<CreateVisitPayload, "at" | "latitude" | "longitude">>({
    mutationKey: ["createVisit"],
    mutationFn: (payload) => {
      const key = keyFor(payload);
      // Where and when go on after the key: a retry is the same visit, even if the GPS moved a little.
      const body: CreateVisitPayload = { ...payload, at: toOffsetIso(), ...recentCoords() };
      return runOrQueue({
        id: key,
        kind: "create_visit",
        label: `زيارة دون بيع — عميل رقم ${payload.customer}`,
        payload: body,
        run: () => createVisit(body, key),
      });
    },
    onSuccess: (data) => {
      reset();
      toast.success(data.message || "تم تسجيل الزيارة");
      options?.onDone?.();
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onDone?.();
        return;
      }
      if (error.response) reset();
      const errors = error.response?.data?.errors;
      toast.error(errors?.note?.[0] || errors?.customer?.[0] || error.response?.data?.message || "تعذّر تسجيل الزيارة");
    },
  });
};

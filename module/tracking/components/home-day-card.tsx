"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRepDay } from "../hooks";
import { formatClock, syriaDateKey } from "../lib/time";

/** "Start my day" / "End my day" — while the day is open, the rep's location is shared with the company. */
export function HomeDayCard() {
  const { day, running, busy, start, end } = useRepDay();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const fromYesterday = running && day && day.date !== syriaDateKey();

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "relative grid size-10 shrink-0 place-items-center rounded-xl",
            running ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <IconRenderer name="location_filled" className="size-5" />
          {running && (
            <span className="absolute -top-0.5 -left-0.5 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-3 rounded-full border-2 border-card bg-primary" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">
            {running ? "يوم العمل جارٍ" : day?.endedAt ? "انتهى يوم العمل" : "لم تبدأ يومك بعد"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {running && day
              ? `${fromYesterday ? "بدأ أمس" : "بدأ"} ${formatClock(day.startedAt)} · موقعك يُرسل للشركة`
              : day?.endedAt
                ? `من ${formatClock(day.startedAt)} حتى ${formatClock(day.endedAt)}`
                : "ابدأ يومك ليظهر خط سيرك وزياراتك للشركة"}
          </p>
        </div>
        {running ? (
          <Button type="button" variant="outline" size="sm" disabled={busy != null} onClick={() => setConfirmEnd(true)}>
            {busy === "end" ? "جارٍ الإنهاء..." : "إنهاء اليوم"}
          </Button>
        ) : (
          !day?.endedAt && (
            <Button type="button" size="sm" disabled={busy != null} onClick={() => void start()}>
              {busy === "start" ? "جارٍ تحديد الموقع..." : "ابدأ يومي"}
            </Button>
          )
        )}
      </div>

      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>إنهاء يوم العمل؟</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">سيتوقف إرسال موقعك للشركة حتى تبدأ يوماً جديداً.</p>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setConfirmEnd(false)}>
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirmEnd(false);
                void end();
              }}
            >
              إنهاء اليوم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

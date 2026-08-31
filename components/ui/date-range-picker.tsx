"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";
import { toISODate } from "@/lib/rep-tour-data";

export type Range = { from?: string; to?: string };

const PRESETS: { key: string; label: string; make: () => Range }[] = [
  {
    key: "today",
    label: "اليوم",
    make: () => {
      const d = toISODate(new Date());
      return { from: d, to: d };
    },
  },
  {
    key: "week",
    label: "هذا الأسبوع",
    make: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 1) % 7));
      return { from: toISODate(start), to: toISODate(now) };
    },
  },
  {
    key: "month",
    label: "هذا الشهر",
    make: () => {
      const now = new Date();
      return {
        from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toISODate(now),
      };
    },
  },
  {
    key: "year",
    label: "هذه السنة",
    make: () => {
      const now = new Date();
      return { from: toISODate(new Date(now.getFullYear(), 0, 1)), to: toISODate(now) };
    },
  },
];

export default function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: Range;
  onChange: (r: Range) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Range>(value);

  const selected: DateRange | undefined = draft.from
    ? { from: new Date(draft.from), to: draft.to ? new Date(draft.to) : undefined }
    : undefined;

  const label = value.from
    ? value.to && value.to !== value.from
      ? `${value.from} → ${value.to}`
      : value.from
    : "كل التواريخ";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      <PopoverTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 text-start text-xs font-bold",
          className,
        )}
      >
        <IconRenderer name="calendar_outlined" className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate font-mono">{label}</span>
        {value.from && (
          <span
            role="button"
            tabIndex={0}
            aria-label="مسح الفلتر"
            onClick={(e) => {
              e.stopPropagation();
              onChange({});
            }}
            onKeyDown={(e) => e.key === "Enter" && onChange({})}
            className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <IconRenderer name="close_outlined" className="size-3" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[2400] w-(--anchor-width) min-w-[min(22rem,92vw)] rounded-3xl p-3"
        dir="rtl"
      >
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                onChange(p.make());
                setOpen(false);
              }}
              className="rounded-xl bg-secondary px-2.5 py-1.5 text-[11px] font-bold text-secondary-foreground active:scale-95"
            >
              {p.label}
            </button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(r) =>
            setDraft({
              ...(r?.from ? { from: toISODate(r.from) } : {}),
              ...(r?.to ? { to: toISODate(r.to) } : {}),
            })
          }
          numberOfMonths={1}
          className="pointer-events-auto p-0"
        />
        <div className="flex gap-2 border-t border-border pt-2.5">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl bg-secondary py-2 text-xs font-bold text-secondary-foreground active:scale-95"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
            className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground active:scale-95"
          >
            تطبيق
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { DayKey, DAYS } from "@/module/map/lib/tour-data";
import { Customer } from "@/module/customers/types";
import { DAY_KEY_TO_API } from "@/module/customers/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DaySelectorProps {
  day: DayKey;
  onDayChange: (day: DayKey) => void;
  customers: Customer[];
  isLoading?: boolean;
}

export function DaySelector({ day, onDayChange, customers, isLoading = false }: DaySelectorProps) {
  const getCountForDay = (d: DayKey): number => {
    const apiDay = DAY_KEY_TO_API[d];
    return customers.filter((c) =>
      c.assigned_reps_details?.[0]?.work_days?.includes(apiDay)
    ).length;
  };

  return (
    <div className="pointer-events-auto mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {DAYS.map((d) => {
        const count = getCountForDay(d.key);
        const active = d.key === day;
        return (
          <Button
            key={d.key}
            onClick={() => onDayChange(d.key)}
            variant={active ? "default" : "secondary"}
            size="sm"
            className="shrink-0 rounded-2xl px-3.5"
          >
            {d.label}
            {isLoading ? (
              <Skeleton className="ms-1.5 h-3 w-3 rounded-full bg-current/20" />
            ) : (
              <span className="ms-1.5 font-mono text-[10px] opacity-70">
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

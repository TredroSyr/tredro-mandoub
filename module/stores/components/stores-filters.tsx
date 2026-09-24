import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DayKey, DAYS } from "@/module/map/lib/tour-data";

export type StoreDayFilter = DayKey | "all";

export interface StoresFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  day: StoreDayFilter;
  onDayChange: (value: StoreDayFilter) => void;
}

export function StoresFilters({
  search,
  onSearchChange,
  day,
  onDayChange,
}: StoresFiltersProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the selected day chip in view (e.g. today's day on first load).
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !active) return;
    const left = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [day]);

  return (
    <div className="mt-3 space-y-2">
      <Input
        placeholder="ابحث بالاسم أو رقم الهاتف أو العنوان..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="text-xs"
      />
      <div
        ref={listRef}
        className="relative flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Button
          data-active={day === "all"}
          variant={day === "all" ? "default" : "secondary"}
          size="sm"
          onClick={() => onDayChange("all")}
          className="shrink-0 text-xs px-3"
        >
          الكل
        </Button>
        {DAYS.map(({ key, label }) => (
          <Button
            key={key}
            data-active={day === key}
            variant={day === key ? "default" : "secondary"}
            size="sm"
            onClick={() => onDayChange(key)}
            className="shrink-0 text-xs px-3"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

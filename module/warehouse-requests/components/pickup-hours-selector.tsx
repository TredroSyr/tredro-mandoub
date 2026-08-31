"use client";

import { PICKUP_HOURS_OPTIONS } from "../lib/utils";

export function PickupHoursSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (hours: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PICKUP_HOURS_OPTIONS.map((h) => (
        <button
          key={h}
          onClick={() => onChange(h)}
          className={`rounded-xl px-3 py-2 font-mono text-xs font-bold ${
            value === h ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {h} س
        </button>
      ))}
    </div>
  );
}

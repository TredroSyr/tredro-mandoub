import { CustomerRequestStatus } from "../types";
import { REQUEST_FILTERS } from "../lib/utils";

export function RequestFilterTabs({
  value,
  onChange,
}: {
  value: CustomerRequestStatus | "all";
  onChange: (status: CustomerRequestStatus | "all") => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {REQUEST_FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`shrink-0 rounded-2xl px-3.5 py-2 text-xs font-bold transition-colors ${
            value === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

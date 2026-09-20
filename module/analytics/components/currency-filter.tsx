"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCurrenciesQuery } from "../hooks";

interface CurrencyFilterProps {
  /** The currency to highlight — the chosen one, or the one the server answered in. */
  value?: string;
  onChange: (code: string) => void;
  className?: string;
}

/** Segmented control over the active currencies from `GET /currencies/`. */
export function CurrencyFilter({ value, onChange, className }: CurrencyFilterProps) {
  const { data, isLoading } = useCurrenciesQuery();
  const currencies = (data?.data?.currencies ?? []).filter((c) => c.is_active);

  if (isLoading) return <Skeleton className="h-10 w-full rounded-2xl" />;
  // Without a list there is nothing to choose — the server keeps answering in the company's currency.
  if (currencies.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="العملة"
      className={cn(
        "flex w-full items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {currencies.map(({ id, code, name }) => {
        const active = value === code;
        return (
          <button
            key={id}
            type="button"
            title={name}
            aria-pressed={active}
            onClick={() => onChange(code)}
            className={cn(
              "h-8 min-w-12 flex-1 shrink-0 rounded-xl px-3 text-xs font-bold transition-colors active:scale-95",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

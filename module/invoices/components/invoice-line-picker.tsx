"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RepProduct } from "@/module/warehouse-requests/types";
import { formatInvoiceMoney, formatInvoiceQuantity } from "../lib/utils";

export function InvoiceLinePicker({
  products,
  isLoading,
  search,
  onSearchChange,
  quantities,
  onQuantityChange,
}: {
  products: RepProduct[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  quantities: Record<number, number>;
  onQuantityChange: (productId: number, quantity: number) => void;
}) {
  return (
    <div>
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="ابحث عن منتج"
        className="text-xs"
      />

      <div className="mt-3 space-y-2">
        {isLoading && (
          <>
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </>
        )}

        {!isLoading && products.length === 0 && (
          <p className="rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
            ما في منتجات قابلة للبيع مطابقة.
          </p>
        )}

        {products.map((p) => {
          const qty = quantities[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{p.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {formatInvoiceMoney(p.price)} · بالسيارة {formatInvoiceQuantity(p.van_quantity)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onQuantityChange(p.id, Math.max(0, qty - 1))}
                  aria-label="إنقاص"
                  className="grid size-8 place-items-center rounded-xl bg-secondary text-secondary-foreground"
                >
                  <IconRenderer name="minus_outlined" className="size-3.5" />
                </button>
                <span className="w-7 text-center font-mono text-sm font-bold">
                  {formatInvoiceQuantity(String(qty))}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(p.id, qty + 1)}
                  aria-label="زيادة"
                  className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground"
                >
                  <IconRenderer name="plus_outlined" className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

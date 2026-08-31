"use client";

import { useMemo, useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateStockTransferMutation, useGetRepProductsQuery } from "../hooks";
import { formatMoneyValue, formatTransferMoney, formatTransferQuantity } from "../lib/utils";
import { PickupHoursSelector } from "./pickup-hours-selector";

export function NewTransferForm() {
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [pickupHours, setPickupHours] = useState(2);

  const { data, isLoading } = useGetRepProductsQuery({ search: search || undefined, page_size: 50 });
  const products = data?.data?.products ?? [];

  const create = useCreateStockTransferMutation({ onSuccess: () => setQuantities({}) });

  const step = (productId: number, delta: number) =>
    setQuantities((q) => ({ ...q, [productId]: Math.max(0, (q[productId] ?? 0) + delta) }));

  const selectedLines = useMemo(
    () =>
      products
        .filter((p) => (quantities[p.id] ?? 0) > 0)
        .map((p) => ({ product: p, quantity: quantities[p.id]! })),
    [products, quantities],
  );

  const total = selectedLines.reduce(
    (sum, { product, quantity }) => sum + (product.price ? parseFloat(product.price) : 0) * quantity,
    0,
  );

  const submit = () => {
    if (selectedLines.length === 0) return;
    create.mutate({
      lines: selectedLines.map(({ product, quantity }) => ({
        product_id: product.id,
        quantity: String(quantity),
      })),
      pickup_within_hours: pickupHours,
    });
  };

  return (
    <section className="mt-4 rounded-3xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="checkout_filled" className="size-4 text-primary" /> طلب بضاعة جديد
      </h2>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث عن منتج"
        className="mt-3 text-xs"
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
            ما في منتجات مطابقة.
          </p>
        )}

        {products.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-background p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{p.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {formatTransferMoney(p.price)} · بالسيارة {formatTransferQuantity(p.van_quantity)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => step(p.id, -1)}
                aria-label="إنقاص"
                className="grid size-8 place-items-center rounded-xl bg-secondary text-secondary-foreground"
              >
                <IconRenderer name="minus_outlined" className="size-3.5" />
              </button>
              <span className="w-7 text-center font-mono text-sm font-bold">
                {formatTransferQuantity(String(quantities[p.id] ?? 0))}
              </span>
              <button
                onClick={() => step(p.id, 1)}
                aria-label="زيادة"
                className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground"
              >
                <IconRenderer name="plus_outlined" className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mb-1.5 mt-4 text-[11px] font-bold text-primary">وقت الاستلام</p>
      <PickupHoursSelector value={pickupHours} onChange={setPickupHours} />

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
        <span className="text-xs font-bold">الإجمالي</span>
        <span className="font-mono text-sm font-extrabold">{formatMoneyValue(total)}</span>
      </div>

      <button
        disabled={selectedLines.length === 0 || create.isPending}
        onClick={submit}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
      >
        <IconRenderer name="send_outlined" className="size-4" /> إرسال الطلب لأمين المستودع
      </button>
    </section>
  );
}

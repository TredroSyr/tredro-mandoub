"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import AppShell from "@/components/layout/app-shell";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useRepTourStore } from "@/store/use-rep-tour-store";
import { ORDER_STATUS, formatMoney, orderTotal, type ShopOrderStatus } from "@/lib/rep-tour-data";

const FILTERS: { key: ShopOrderStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "معلّق" },
  { key: "accepted", label: "مقبول" },
  { key: "delivered", label: "مسلّم" },
  { key: "rejected", label: "مرفوض" },
];

export default function OrdersPage() {
  const { orders, setOrderStatus } = useRepTourStore(
    useShallow((s) => ({
      orders: s.orders,
      setOrderStatus: s.setOrderStatus,
    })),
  );
  const [filter, setFilter] = useState<ShopOrderStatus | "all">("all");

  const list = [...orders]
    .filter((o) => filter === "all" || o.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell title="الطلبات" subtitle={`${orders.length} Orders`}>
      <div className="flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-2xl px-3.5 py-2 text-xs font-bold transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-2.5">
        {list.length === 0 && (
          <p className="rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
            ما في طلبات ضمن هذا التصنيف.
          </p>
        )}
        {list.map((o) => (
          <article key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">{o.shopName}</h2>
                <p className="truncate text-[11px] text-muted-foreground">{o.shopAddress}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{o.date}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${ORDER_STATUS[o.status].tone}`}
              >
                {ORDER_STATUS[o.status].label}
              </span>
            </div>

            <ul className="mt-3 space-y-1.5">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3 text-[11px]">
                  <span className="truncate text-muted-foreground">{it.name}</span>
                  <span className="shrink-0 font-mono">
                    ×{it.qty} · {formatMoney(it.qty * it.price)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-mono text-xs font-extrabold text-primary">
                {formatMoney(orderTotal(o))}
              </span>
              <div className="flex gap-1.5">
                {o.status === "pending" && (
                  <>
                    <button
                      onClick={() => setOrderStatus(o.id, "accepted")}
                      className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground"
                    >
                      <IconRenderer name="tick_outlined" className="size-3.5" /> قبول
                    </button>
                    <button
                      onClick={() => setOrderStatus(o.id, "rejected")}
                      className="flex items-center gap-1 rounded-xl bg-destructive/12 px-3 py-2 text-[11px] font-bold text-destructive"
                    >
                      <IconRenderer name="close_outlined" className="size-3.5" /> رفض
                    </button>
                  </>
                )}
                {o.status === "accepted" && (
                  <button
                    onClick={() => setOrderStatus(o.id, "delivered")}
                    className="flex items-center gap-1 rounded-xl bg-success px-3 py-2 text-[11px] font-bold text-success-foreground"
                  >
                    <IconRenderer name="checkout_outlined" className="size-3.5" /> تم التسليم
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

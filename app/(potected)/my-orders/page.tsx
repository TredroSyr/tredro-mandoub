"use client";

import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import AppShell from "@/components/layout/app-shell";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useRepTourStore } from "@/store/use-rep-tour-store";
import {
  REP_ORDER_STATUS,
  formatMoney,
  formatNum,
  formatTime,
  orderTotal,
  repOrderDisplayStatus,
  type RepOrder,
} from "@/lib/rep-tour-data";

const HOURS = [1, 2, 3, 4, 6];

export default function MyOrdersPage() {
  const { stock, repOrders, companyInvoices, addRepOrder, receiveRepOrder } = useRepTourStore(
    useShallow((s) => ({
      stock: s.stock,
      repOrders: s.repOrders,
      companyInvoices: s.companyInvoices,
      addRepOrder: s.addRepOrder,
      receiveRepOrder: s.receiveRepOrder,
    })),
  );

  const [tab, setTab] = useState<"orders" | "invoices">("orders");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [hours, setHours] = useState(2);

  const items = useMemo(
    () =>
      stock
        .filter((s) => (qty[s.id] ?? 0) > 0)
        .map((s) => ({ id: s.id, name: s.name, qty: qty[s.id]!, price: s.price })),
    [stock, qty],
  );
  const total = items.reduce((t, i) => t + i.qty * i.price, 0);

  const list = [...repOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const invoices = [...companyInvoices].sort((a, b) => b.date.localeCompare(a.date));

  const submit = () => {
    if (items.length === 0) return;
    const now = new Date();
    const order: RepOrder = {
      id: crypto.randomUUID(),
      createdAt: now.toISOString(),
      pickupHours: hours,
      deadline: new Date(now.getTime() + hours * 3600000).toISOString(),
      status: "pending",
      items,
    };
    addRepOrder(order);
    setQty({});
  };

  const step = (id: string, d: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + d) }));

  return (
    <AppShell title="طلباتي" subtitle="Warehouse Requests">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {(
          [
            ["orders", "طلبات المستودع"],
            ["invoices", "فواتير الشركة"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl py-2.5 text-xs font-bold transition-colors ${
              tab === key ? "bg-card text-primary shadow-float" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <>
          {/* إنشاء طلب */}
          <section className="mt-4 rounded-3xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <IconRenderer name="checkout_filled" className="size-4 text-primary" /> طلب بضاعة جديد
            </h2>

            <div className="mt-3 space-y-2">
              {stock.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-background p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{s.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {formatMoney(s.price)} · بالسيارة {formatNum(s.qty)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => step(s.id, -1)}
                      aria-label="إنقاص"
                      className="grid size-8 place-items-center rounded-xl bg-secondary text-secondary-foreground"
                    >
                      <IconRenderer name="minus_outlined" className="size-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono text-sm font-bold">
                      {formatNum(qty[s.id] ?? 0)}
                    </span>
                    <button
                      onClick={() => step(s.id, 1)}
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
            <div className="flex flex-wrap gap-1.5">
              {HOURS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={`rounded-xl px-3 py-2 font-mono text-xs font-bold ${
                    hours === h
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {formatNum(h)} س
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
              <span className="text-xs font-bold">الإجمالي</span>
              <span className="font-mono text-sm font-extrabold">{formatMoney(total)}</span>
            </div>

            <button
              disabled={items.length === 0}
              onClick={submit}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
            >
              <IconRenderer name="send_outlined" className="size-4" /> إرسال الطلب لأمين المستودع
            </button>
          </section>

          <div className="mt-4 space-y-2.5">
            {list.length === 0 && (
              <p className="rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
                ما في طلبات بعد.
              </p>
            )}
            {list.map((o) => {
              const status = repOrderDisplayStatus(o);
              return (
                <article key={o.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-bold">
                        {o.createdAt.slice(0, 10)} · {formatTime(o.createdAt)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        مهلة الاستلام {formatNum(o.pickupHours)} ساعة · حتى {formatTime(o.deadline)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${REP_ORDER_STATUS[status].tone}`}
                    >
                      {REP_ORDER_STATUS[status].label}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-3 text-[11px]">
                        <span className="truncate text-muted-foreground">{it.name}</span>
                        <span className="shrink-0 font-mono">
                          ×{formatNum(it.qty)} · {formatMoney(it.qty * it.price)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="font-mono text-xs font-extrabold text-primary">
                      {formatMoney(orderTotal(o))}
                    </span>
                    {status === "accepted" && (
                      <button
                        onClick={() => receiveRepOrder(o.id)}
                        className="flex items-center gap-1 rounded-xl bg-success px-3 py-2 text-[11px] font-bold text-success-foreground"
                      >
                        <IconRenderer name="checkout_outlined" className="size-3.5" /> استلمت البضاعة
                      </button>
                    )}
                    {status === "delivered" && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                        <IconRenderer name="tick_outlined" className="size-3.5" /> أُضيفت لمستودع السيارة
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {tab === "invoices" && (
        <div className="mt-4 space-y-2">
          {invoices.length === 0 && (
            <p className="rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
              ما في فواتير بعد.
            </p>
          )}
          {invoices.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] font-bold">{i.no}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{i.date}</p>
              </div>
              <span className="font-mono text-[11px]">{formatMoney(i.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import DateRangePicker, { type Range } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard, SkeletonStat } from "@/components/ui/skeleton";
import { useGetDashboardQuery } from "@/module/dashboard/hooks";
import { formatCurrency } from "@/module/customers/lib/utils";
import { toISODate } from "@/lib/rep-tour-data";

function formatQty(v: string) {
  const n = parseFloat(v);
  return (Number.isFinite(n) ? n : 0).toLocaleString("ar-SY", { maximumFractionDigits: 2 });
}

const SALES_STATUS_LABEL: Record<string, string> = {
  fully_paid: "مدفوعة",
  partially_paid: "معلّقة",
  deferred: "آجلة",
};

export default function HomePage() {
  const today = toISODate(new Date());
  const [range, setRange] = useState<Range>({ from: today, to: today });

  const params = useMemo(
    () => (range.from || range.to ? { date_from: range.from, date_to: range.to } : undefined),
    [range.from, range.to],
  );

  const { data, isLoading, isError, refetch, isFetching } = useGetDashboardQuery(params);
  const dashboard = data?.data;

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <div className="mt-5 space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <IconRenderer name="warning_outlined" className="w-12 h-12 text-destructive/60" />
        <p className="text-sm text-muted-foreground">حدث خطأ أثناء تحميل بيانات الرئيسية.</p>
        <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <IconRenderer name="refresh_outlined" className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const { sales, returns, receivables, warehouse } = dashboard;

  return (
    <>
      <DateRangePicker value={range} onChange={setRange} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-primary p-4 text-primary-foreground shadow-float">
          <IconRenderer name="revenue_filled" className="size-5 opacity-80" />
          <p className="mt-3 font-mono text-lg font-bold">{formatCurrency(sales.total_amount)}</p>
          <p className="text-[11px] opacity-85">مبيعات الفترة ({sales.invoice_count} فاتورة)</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4">
          <IconRenderer name="money_filled" className="size-5 text-primary" />
          <p className="mt-3 font-mono text-lg font-bold">{formatCurrency(receivables.total_balance_due)}</p>
          <p className="text-[11px] text-muted-foreground">
            إجمالي المستحقات
            {receivables.overdue_invoice_count > 0 && (
              <span className="text-warning"> · {receivables.overdue_invoice_count} متأخرة</span>
            )}
          </p>
        </div>
      </div>

      {/* المبيعات */}
      <section className="mt-5">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <IconRenderer name="sales_filled" className="size-4 text-primary" /> المبيعات
          </h2>
          {returns.count > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <IconRenderer name="undo_filled" className="size-3.5" />
              مرتجعات الفترة {returns.count}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {sales.invoices.length === 0 && (
            <p className="rounded-2xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
              ما في مبيعات ضمن هذه الفترة.
            </p>
          )}
          {sales.invoices.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{i.customer_name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {i.number} · {new Date(i.date).toLocaleDateString("ar-SY")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-xs font-bold">{formatCurrency(i.total_amount)}</span>
                <Badge variant={i.status === "fully_paid" ? "success" : "warning"}>
                  {SALES_STATUS_LABEL[i.status] ?? i.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* مستودع السيارة */}
      <section className="mt-6">
        <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
          <IconRenderer name="checkout_filled" className="size-4 text-primary" /> مستودع السيارة
          {warehouse && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatQty(warehouse.total_quantity)} قطعة
            </span>
          )}
        </h2>
        {!warehouse ? (
          <p className="rounded-2xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
            لا يوجد مستودع سيارة معيّن لك حاليًا.
          </p>
        ) : warehouse.items.length === 0 ? (
          <p className="rounded-2xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
            المستودع فارغ حاليًا.
          </p>
        ) : (
          <div className="space-y-2">
            {warehouse.items.map((it) => (
              <div
                key={it.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{it.product_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {it.unit_price != null ? formatCurrency(it.unit_price) : "بدون سعر"} / {it.unit_name}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${
                    it.is_low_stock ? "bg-warning/20 text-warning-foreground" : "bg-primary/12 text-primary"
                  }`}
                >
                  {formatQty(it.quantity)} {it.unit_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

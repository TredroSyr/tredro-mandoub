"use client";

import Link from "next/link";
import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { InvoiceDetailDrawer } from "@/module/invoices/components";
import { useGetSalesInvoicesQuery } from "@/module/invoices/hooks";
import { formatCurrency, formatDate } from "@/lib/format";

const PREVIEW_COUNT = 3;

export function HomeOverdueSection() {
  const { data, isLoading } = useGetSalesInvoicesQuery({ overdue: true, page_size: PREVIEW_COUNT });
  const invoices = data?.data?.invoices ?? [];
  const totalCount = data?.data?.pagination?.count ?? invoices.length;
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);

  // No skeleton here: this section is conditional (may end up empty). A
  // local skeleton would flash in and then collapse, causing a layout jump.
  // Stay hidden until we know there's something to render.
  if (isLoading || invoices.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="money_filled" className="size-4 text-destructive" /> ديون متأخرة
        <span className="font-mono text-[11px] text-muted-foreground">{totalCount}</span>
      </h2>

      <div className="space-y-2">
        {invoices.map((invoice) => (
          <button
            key={invoice.id}
            type="button"
            onClick={() => setDetailInvoiceId(invoice.id)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 text-start"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{invoice.customer_name}</p>
              <p dir="ltr" className="truncate font-mono text-[10px] text-muted-foreground">
                {invoice.number} · {formatDate(invoice.date)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-xs font-bold text-destructive">
                {formatCurrency(invoice.balance_due)}
              </span>
              {invoice.days_overdue != null && (
                <span className="text-[10px] text-muted-foreground">متأخرة {invoice.days_overdue} يوم</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {totalCount > PREVIEW_COUNT && (
        <Link
          href="/sales/overdue"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-2.5 text-xs font-bold text-primary"
        >
          عرض المزيد
          <IconRenderer name="arrow_left_outlined" className="size-3.5" />
        </Link>
      )}

      <InvoiceDetailDrawer
        invoiceId={detailInvoiceId}
        open={detailInvoiceId != null}
        onOpenChange={(open) => !open && setDetailInvoiceId(null)}
      />
    </section>
  );
}

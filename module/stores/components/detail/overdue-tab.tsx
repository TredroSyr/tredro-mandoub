"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/tredro/error-state";
import { EmptyState } from "@/components/tredro/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { InvoiceDetailDrawer } from "@/module/invoices/components";
import { useGetCustomerSalesInvoicesQuery } from "@/module/customers/hooks";

export function OverdueTab({ customerId }: { customerId: number }) {
  const [openInvoiceId, setOpenInvoiceId] = useState<number | null>(null);
  const q = useGetCustomerSalesInvoicesQuery(customerId, { overdue: true, page_size: 50 });

  if (q.isLoading) {
    return (
      <div className="mt-4 space-y-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <ErrorState
        error={q.error}
        onRetry={() => q.refetch()}
        isRetrying={q.isFetching}
        className="mt-4 gap-2 rounded-2xl bg-muted/40 p-6 py-6"
      />
    );
  }

  const invoices = q.data?.data?.invoices ?? [];

  if (invoices.length === 0) {
    return (
      <EmptyState
        variant="sales"
        size="sm"
        className="mt-4"
        title="لا توجد ديون متأخرة"
        description="لا توجد لدى هذا المحل فواتير متأخرة عن السداد حالياً."
      />
    );
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        {invoices.map((invoice) => (
          <button
            key={invoice.id}
            type="button"
            onClick={() => setOpenInvoiceId(invoice.id)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 text-start"
          >
            <div className="min-w-0">
              <p dir="ltr" className="truncate font-mono text-[11px] font-bold">
                {invoice.number}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">{formatDate(invoice.date)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-xs font-bold text-destructive">
                {formatCurrency(invoice.balance_due)}
              </span>
              {invoice.line_count != null && (
                <span className="text-[10px] text-muted-foreground">{invoice.line_count} أصناف</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <InvoiceDetailDrawer
        invoiceId={openInvoiceId}
        open={openInvoiceId != null}
        onOpenChange={(open) => !open && setOpenInvoiceId(null)}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { ErrorState } from "@/components/tredro/error-state";
import DateRangePicker, { type Range } from "@/components/ui/date-range-picker";
import { InvoiceDetailDrawer, SalesInvoiceRow } from "@/module/invoices/components";
import { useGetSalesInvoicesQuery } from "@/module/invoices/hooks";

export default function SalesPage() {
  const [range, setRange] = useState<Range>({});
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useGetSalesInvoicesQuery({
    date_from: range.from,
    date_to: range.to,
    page_size: 50,
  });
  const invoices = data?.data?.invoices ?? [];

  return (
    <>
      <h1 className="mb-3 flex items-center gap-2 text-base font-extrabold">
        <IconRenderer name="sales_filled" className="size-4 text-primary" /> كل المبيعات
      </h1>

      <DateRangePicker value={range} onChange={setRange} className="mb-4" />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} isRetrying={isFetching} />
      ) : isLoading ? (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState variant="sales" size="sm" />
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <SalesInvoiceRow key={invoice.id} invoice={invoice} onClick={() => setDetailInvoiceId(invoice.id)} />
          ))}
        </div>
      )}

      <InvoiceDetailDrawer
        invoiceId={detailInvoiceId}
        open={detailInvoiceId != null}
        onOpenChange={(open) => !open && setDetailInvoiceId(null)}
      />
    </>
  );
}

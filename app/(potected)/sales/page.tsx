"use client";

import { useState } from "react";
import { PendingSyncList } from "@/components/tredro/pending-sync";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { ErrorState } from "@/components/tredro/error-state";
import DateRangePicker, { type Range } from "@/components/ui/date-range-picker";
import { InvoiceDetailDrawer, SalesInvoiceRow } from "@/module/invoices/components";
import { useGetSalesInvoicesQuery } from "@/module/invoices/hooks";
import { needsErrorState } from "@/lib/network-status";

export default function SalesPage() {
  const [range, setRange] = useState<Range>({});
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);

  const {
    data,
    isLoading,
    isError: queryFailed,
    error,
    refetch,
    isFetching,
    fetchStatus,
  } = useGetSalesInvoicesQuery({
    date_from: range.from,
    date_to: range.to,
    page_size: 50,
  });
  // Cached data stays on screen when a refresh fails (e.g. offline).
  const isError = needsErrorState({ isError: queryFailed, data, fetchStatus });
  const invoices = data?.data?.invoices ?? [];

  return (
    <>
      <h1 className="mb-3 flex items-center gap-2 text-base font-extrabold">
        <IconRenderer name="sales_filled" className="size-4 text-primary" /> كل المبيعات
      </h1>

      <DateRangePicker value={range} onChange={setRange} className="mb-4" />

      <PendingSyncList
        kinds={["create_sales_invoice", "create_payment", "issue_return_invoice"]}
        title="بانتظار المزامنة"
        note="تم حفظها على جهازك ولا تظهر في القائمة أدناه بعد — ستُرسل تلقائيًا عند توفر الاتصال."
        className="mb-4"
      />

      {isError ? (
        <ErrorState
          error={error}
          fetchStatus={fetchStatus}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
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

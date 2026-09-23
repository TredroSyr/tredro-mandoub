"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { ErrorState } from "@/components/tredro/error-state";
import { InvoiceDetailDrawer } from "@/module/invoices/components";
import { useGetSalesInvoicesQuery } from "@/module/invoices/hooks";
import { formatCurrency, formatDate } from "@/lib/format";
import { needsErrorState } from "@/lib/network-status";

export default function OverdueInvoicesPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <OverdueInvoicesContent />
    </Suspense>
  );
}

function OverdueInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Captured once on mount: a "sales_invoice.overdue" notification tap lands
  // here with ?invoiceId= to jump straight into that invoice's detail drawer.
  const [openInvoiceId, setOpenInvoiceId] = useState<number | null>(() => {
    const id = searchParams.get("invoiceId");
    return id ? Number(id) : null;
  });

  useEffect(() => {
    if (searchParams.get("invoiceId")) router.replace("/sales/overdue");
    // Only meant to strip the query param once, right after reading it above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data,
    isLoading,
    isError: queryFailed,
    error,
    refetch,
    isFetching,
    fetchStatus,
  } = useGetSalesInvoicesQuery({
    overdue: true,
    page_size: 50,
  });
  // Cached data stays on screen when a refresh fails (e.g. offline).
  const isError = needsErrorState({ isError: queryFailed, data, fetchStatus });
  const invoices = data?.data?.invoices ?? [];

  return (
    <>
      <h1 className="mb-3 flex items-center gap-2 text-base font-extrabold">
        <IconRenderer name="money_filled" className="size-4 text-destructive" />
        الديون
        {!isLoading && invoices.length > 0 && (
          <Badge variant="destructive">{invoices.length}</Badge>
        )}
      </h1>

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
        <EmptyState
          variant="sales"
          size="sm"
          title="لا توجد ديون متأخرة"
          description="لا توجد لديك فواتير متأخرة عن السداد حالياً."
        />
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <button
              key={invoice.id}
              type="button"
              onClick={() => setOpenInvoiceId(invoice.id)}
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
                {invoice.line_count != null && (
                  <span className="text-[10px] text-muted-foreground">{invoice.line_count} أصناف</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <InvoiceDetailDrawer
        invoiceId={openInvoiceId}
        open={openInvoiceId != null}
        onOpenChange={(open) => !open && setOpenInvoiceId(null)}
      />
    </>
  );
}

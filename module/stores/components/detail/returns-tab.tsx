import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReturnInvoice } from "@/module/customers/types";
import { ReturnDetailDrawer } from "./return-detail-drawer";
import { ErrorState } from "@/components/tredro/error-state";
import { EmptyState } from "@/components/tredro/empty-state";
import { formatCurrency } from "@/lib/format";
import { needsErrorState } from "@/lib/network-status";
import { useGetCustomerReturnInvoicesQuery } from "@/module/customers/hooks";

export function ReturnsTab({ query: q }: { query: ReturnType<typeof useGetCustomerReturnInvoicesQuery> }) {
  const [selected, setSelected] = useState<ReturnInvoice | null>(null);

  if (q.isLoading) {
    return (
      <div className="mt-4 space-y-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  if (needsErrorState(q)) {
    return (
      <ErrorState
        error={q.error}
        fetchStatus={q.fetchStatus}
        onRetry={() => q.refetch()}
        isRetrying={q.isFetching}
        className="mt-4 gap-2 rounded-2xl bg-muted/40 p-6 py-6"
      />
    );
  }

  const returns = q.data?.data?.return_invoices ?? [];
  if (returns.length === 0) {
    return (
      <EmptyState
        variant="sales"
        size="sm"
        className="mt-4"
        title="لا توجد مرتجعات"
        description="لا توجد مرتجعات مسجّلة لهذا المحل حتى الآن."
      />
    );
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        {returns.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelected(r)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 text-right"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] font-bold">{r.number}</p>
              <p className="font-mono text-[10px] text-muted-foreground">مرتبط بـ {r.sales_invoice_number}</p>
            </div>
            <span className="font-mono text-[11px] font-bold text-destructive">-{formatCurrency(r.amount)}</span>
          </button>
        ))}
      </div>
      <ReturnDetailDrawer item={selected} open={selected != null} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}

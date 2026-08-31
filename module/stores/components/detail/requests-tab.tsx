import { ErrorState } from "@/components/tredro/error-state";
import { EmptyState } from "@/components/tredro/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatQuantity, formatDate } from "@/lib/format";
import { RequestStatusBadge } from "@/module/orders/components";
import { useGetCustomerRequestsQuery } from "@/module/customers/hooks";

export function RequestsTab({ query: q }: { query: ReturnType<typeof useGetCustomerRequestsQuery> }) {
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

  const requests = q.data?.data?.requests ?? [];
  if (requests.length === 0) return <EmptyState variant="requests" size="sm" className="mt-4" />;

  return (
    <div className="mt-4 space-y-2">
      {requests.map((r) => (
        <article key={r.id} className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] text-muted-foreground">{formatDate(r.created_at)}</p>
            <RequestStatusBadge status={r.status} />
          </div>
          <ul className="mt-2 space-y-1">
            {r.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 text-[11px]">
                <span className="truncate text-muted-foreground">{l.product_name}</span>
                <span className="shrink-0 font-mono">
                  ×{formatQuantity(l.desired_quantity)} {l.unit_name}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="font-mono text-[11px] font-bold text-primary">
              {r.estimated_total == null ? "بدون سعر" : formatCurrency(r.estimated_total)}
            </span>
            {r.fulfilled_by_invoice_number && (
              <span className="text-[10px] text-success">نُفِّذ عبر الفاتورة {r.fulfilled_by_invoice_number}</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/tredro/error-state";
import { EmptyState } from "@/components/tredro/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { useGetCustomerPaymentsQuery } from "@/module/customers/hooks";

export function PaymentsTab({ query: q }: { query: ReturnType<typeof useGetCustomerPaymentsQuery> }) {
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

  const payments = q.data?.data?.payments ?? [];
  if (payments.length === 0) {
    return (
      <EmptyState
        variant="sales"
        size="sm"
        className="mt-4"
        title="لا توجد دفعات مسجّلة"
        description="لم يتم تسجيل أي دفعة من هذا المحل حتى الآن."
      />
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {payments.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
        >
          <span className="font-mono text-[11px] text-muted-foreground">{formatDate(p.date)}</span>
          <span className="font-mono text-xs font-bold text-success">+{formatCurrency(p.amount)}</span>
        </div>
      ))}
    </div>
  );
}

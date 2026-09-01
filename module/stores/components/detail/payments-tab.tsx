import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/tredro/error-state";
import { EmptyState } from "@/components/tredro/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { useGetCustomerPaymentsQuery } from "@/module/customers/hooks";

/** Only "cash" is confirmed live; other sources fall back to showing the raw value as-is. */
const SOURCE_LABEL: Record<string, string> = {
  cash: "نقداً",
};

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
  const totalAmount = q.data?.data?.total_amount;

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
    <div className="mt-4 space-y-3">
      {totalAmount != null && (
        <div className="flex items-center justify-between rounded-2xl bg-success/10 px-4 py-3">
          <span className="text-xs font-bold text-success">إجمالي المحصَّل</span>
          <span className="font-mono text-sm font-extrabold text-success">{formatCurrency(totalAmount)}</span>
        </div>
      )}

      <div className="space-y-2">
        {payments.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground">رقم الفاتورة</p>
                <p className="truncate font-mono text-[11px] font-bold">{p.sales_invoice_number}</p>
              </div>
              <div className="shrink-0 text-left">
                <p className="text-[9px] font-bold text-muted-foreground">المبلغ المحصَّل</p>
                <span className="font-mono text-xs font-bold text-success">+{formatCurrency(p.amount)}</span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-2 text-[11px]">
              <Field label="التاريخ" value={formatDate(p.collected_at)} />
              <Field label="طريقة التحصيل" value={SOURCE_LABEL[p.source] ?? p.source} />
              {p.collected_by_name && <Field label="بواسطة" value={p.collected_by_name} />}
              {p.note && <Field label="ملاحظة" value={p.note} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-muted-foreground">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}

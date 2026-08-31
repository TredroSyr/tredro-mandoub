import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { Customer } from "@/module/customers/types";

export interface StoreFinancialSummaryProps {
  customer?: Customer;
  isLoading: boolean;
}

export function StoreFinancialSummary({ customer, isLoading }: StoreFinancialSummaryProps) {
  const balanceDue = customer ? parseFloat(customer.balance_due) || 0 : 0;

  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-2xl border border-border bg-card py-3">
        <p className="text-[10px] text-muted-foreground">إجمالي الفواتير</p>
        {isLoading || !customer ? (
          <Skeleton className="mx-auto mt-1 h-4 w-14" />
        ) : (
          <p className="mt-1 font-mono text-[11px] font-bold">{formatCurrency(customer.total_invoiced)}</p>
        )}
      </div>
      <div className="rounded-2xl bg-success/12 py-3">
        <p className="text-[10px] text-muted-foreground">المدفوع</p>
        {isLoading || !customer ? (
          <Skeleton className="mx-auto mt-1 h-4 w-14" />
        ) : (
          <p className="mt-1 font-mono text-[11px] font-bold text-success">{formatCurrency(customer.paid_amount)}</p>
        )}
      </div>
      <div className={`rounded-2xl py-3 ${!isLoading && customer && balanceDue > 0 ? "bg-warning/20" : "bg-muted"}`}>
        <p className="text-[10px] text-muted-foreground">المتبقي</p>
        {isLoading || !customer ? (
          <Skeleton className="mx-auto mt-1 h-4 w-14" />
        ) : (
          <p className="mt-1 font-mono text-[11px] font-bold">{formatCurrency(customer.balance_due)}</p>
        )}
      </div>
    </div>
  );
}

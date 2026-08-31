import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/module/dashboard/types";

export interface HomeSummaryCardsProps {
  dashboard?: DashboardData;
  isLoading: boolean;
}

export function HomeSummaryCards({ dashboard, isLoading }: HomeSummaryCardsProps) {
  const sales = dashboard?.sales;
  const receivables = dashboard?.receivables;

  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="rounded-3xl bg-primary p-4 text-primary-foreground shadow-float">
        <IconRenderer name="revenue_filled" className="size-5 opacity-80" />
        {isLoading ? (
          <Skeleton className="mt-3 h-6 w-24 bg-primary-foreground/20" />
        ) : (
          <p className="mt-3 font-mono text-lg font-bold">{formatCurrency(sales!.total_amount)}</p>
        )}
        <p className="text-[11px] opacity-85">
          مبيعات الفترة{!isLoading && ` (${sales!.invoice_count} فاتورة)`}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <IconRenderer name="money_filled" className="size-5 text-primary" />
        {isLoading ? (
          <Skeleton className="mt-3 h-6 w-24" />
        ) : (
          <p className="mt-3 font-mono text-lg font-bold">{formatCurrency(receivables!.total_balance_due)}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          إجمالي المستحقات
          {!isLoading && receivables!.overdue_invoice_count > 0 && (
            <span className="text-warning"> · {receivables!.overdue_invoice_count} متأخرة</span>
          )}
        </p>
      </div>
    </div>
  );
}

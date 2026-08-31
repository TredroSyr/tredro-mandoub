import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DashboardData } from "@/module/dashboard/types";
import type { SalesInvoice } from "@/module/customers/types";

const SALES_STATUS_LABEL: Record<string, string> = {
  fully_paid: "مدفوعة",
  partially_paid: "معلّقة",
  deferred: "آجلة",
};

export interface HomeSalesSectionProps {
  dashboard?: DashboardData;
  isLoading: boolean;
}

export function HomeSalesSection({ dashboard, isLoading }: HomeSalesSectionProps) {
  const sales = dashboard?.sales;
  const returnsCount = dashboard?.returns.count ?? 0;

  return (
    <section className="mt-5">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <IconRenderer name="sales_filled" className="size-4 text-primary" /> المبيعات
        </h2>
        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          returnsCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <IconRenderer name="undo_filled" className="size-3.5" />
              مرتجعات الفترة {returnsCount}
            </span>
          )
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !sales || sales.invoices.length === 0 ? (
        <EmptyState variant="sales" size="sm" />
      ) : (
        <div className="space-y-2">
          {sales.invoices.map((invoice) => (
            <SalesInvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}
    </section>
  );
}

function SalesInvoiceRow({ invoice }: { invoice: SalesInvoice }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{invoice.customer_name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {invoice.number} · {formatDate(invoice.date)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-xs font-bold">{formatCurrency(invoice.total_amount)}</span>
        <Badge variant={invoice.status === "fully_paid" ? "success" : "warning"}>
          {SALES_STATUS_LABEL[invoice.status] ?? invoice.status}
        </Badge>
      </div>
    </div>
  );
}

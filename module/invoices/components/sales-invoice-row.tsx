import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SalesInvoice } from "../types";

const SALES_STATUS_LABEL: Record<string, string> = {
  fully_paid: "مدفوعة",
  partially_paid: "معلّقة",
  deferred: "آجلة",
};

function RowContent({ invoice }: { invoice: SalesInvoice }) {
  return (
    <>
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
    </>
  );
}

export function SalesInvoiceRow({ invoice, onClick }: { invoice: SalesInvoice; onClick?: () => void }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 text-start"
      >
        <RowContent invoice={invoice} />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5">
      <RowContent invoice={invoice} />
    </div>
  );
}

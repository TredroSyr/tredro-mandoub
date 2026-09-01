import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { ErrorState } from "@/components/tredro/error-state";
import { EmptyState } from "@/components/tredro/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { useGetCustomerSalesInvoicesQuery } from "@/module/customers/hooks";
import {
  CreateInvoiceDrawer,
  CreateReturnDrawer,
  InvoiceDetailDrawer,
  RecordPaymentDialog,
} from "@/module/invoices/components";
import { SalesInvoice } from "@/module/customers/types";

const SALES_STATUS_LABEL: Record<string, string> = {
  fully_paid: "مدفوعة",
  partially_paid: "معلّقة",
};

export function InvoicesTab({
  query: q,
  customerId,
}: {
  query: ReturnType<typeof useGetCustomerSalesInvoicesQuery>;
  customerId: number;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<SalesInvoice | null>(null);
  const [returnTarget, setReturnTarget] = useState<{ id: number; number: string } | null>(null);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);

  const invoices = q.data?.data?.invoices ?? [];

  return (
    <>
      <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={() => setCreateOpen(true)}>
        <IconRenderer name="plus_outlined" className="w-4 h-4" />
        فاتورة جديدة
      </Button>

      {q.isLoading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : q.isError ? (
        <ErrorState
          error={q.error}
          onRetry={() => q.refetch()}
          isRetrying={q.isFetching}
          className="mt-3 gap-2 rounded-2xl bg-muted/40 p-6 py-6"
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          variant="sales"
          size="sm"
          className="mt-3"
          title="لا توجد فواتير بعد"
          description="لم تُصدر أي فاتورة مبيعات لهذا المحل حتى الآن."
        />
      ) : (
        <div className="mt-3 space-y-2">
          {invoices.map((i) => (
            <div key={i.id} className="rounded-2xl border border-border bg-card px-3.5 py-3">
              <button
                type="button"
                onClick={() => setDetailInvoiceId(i.id)}
                className="flex w-full items-center justify-between gap-3 text-right"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] font-bold">{i.number}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{formatDate(i.date)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[11px]">{formatCurrency(i.total_amount)}</span>
                  <Badge variant={i.status === "fully_paid" ? "success" : "warning"}>
                    {SALES_STATUS_LABEL[i.status] ?? "معلّقة"}
                  </Badge>
                </div>
              </button>

              <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                {i.status !== "fully_paid" && (
                  <button
                    onClick={() => setPaymentInvoice(i)}
                    className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold text-primary"
                  >
                    <IconRenderer name="money_outlined" className="size-3" /> تسجيل دفعة
                  </button>
                )}
                <button
                  onClick={() => setReturnTarget({ id: i.id, number: i.number })}
                  className="flex items-center gap-1 rounded-xl bg-destructive/10 px-2.5 py-1.5 text-[10px] font-bold text-destructive"
                >
                  <IconRenderer name="undo_outlined" className="size-3" /> مرتجع
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateInvoiceDrawer open={createOpen} onOpenChange={setCreateOpen} customerId={customerId} />
      <RecordPaymentDialog
        invoice={paymentInvoice}
        open={!!paymentInvoice}
        onOpenChange={(open) => !open && setPaymentInvoice(null)}
      />
      <CreateReturnDrawer
        invoiceId={returnTarget?.id ?? null}
        invoiceNumber={returnTarget?.number ?? ""}
        open={!!returnTarget}
        onOpenChange={(open) => !open && setReturnTarget(null)}
      />
      <InvoiceDetailDrawer
        invoiceId={detailInvoiceId}
        open={detailInvoiceId != null}
        onOpenChange={(open) => !open && setDetailInvoiceId(null)}
      />
    </>
  );
}

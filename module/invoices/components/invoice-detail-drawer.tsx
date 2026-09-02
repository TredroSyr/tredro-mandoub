"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGetSalesInvoiceDetailQuery } from "../hooks";
import { renderNodeToPdfBlob } from "../lib/pdf";
import { openWhatsAppChat, shareInvoicePdf } from "../lib/share";
import { formatInvoiceMoney, formatInvoiceQuantity } from "../lib/utils";
import { InvoicePrintTemplate } from "./invoice-print-template";

const STATUS_LABEL: Record<string, string> = {
  fully_paid: "مدفوعة",
  partially_paid: "معلّقة",
  deferred: "آجلة",
};

export function InvoiceDetailDrawer({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useGetSalesInvoiceDetailQuery(invoiceId, {
    enabled: open,
  });
  const invoice = data?.data?.invoice;

  const buildPdf = async () => {
    if (!printRef.current) return null;
    return renderNodeToPdfBlob(printRef.current);
  };

  const handleShareMessage = () => {
    if (!invoice) return;
    const text = [
      `فاتورة ${invoice.number}`,
      `${invoice.company_name}`,
      `الإجمالي: ${formatInvoiceMoney(invoice.total_amount)}`,
      `المحصَّل: ${formatInvoiceMoney(invoice.paid_amount)}`,
      `المتبقي: ${formatInvoiceMoney(invoice.balance_due)}`,
    ].join("\n");
    openWhatsAppChat(invoice.customer_phone, text);
  };

  const handleSharePdf = async () => {
    if (!invoice) return;
    setIsExporting(true);
    try {
      const blob = await buildPdf();
      if (!blob) return;
      await shareInvoicePdf(blob, `invoice-${invoice.number}.pdf`, `فاتورة ${invoice.number}`);
    } catch {
      toast.error("تعذّر تجهيز ملف PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={isMobile ? "down" : "left"}>
      <DrawerContent
        avoidBottomNav
        className="flex h-[92dvh] max-h-[92dvh] w-full flex-col rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl"
      >
        <DrawerHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-3 border-b border-border bg-background px-4 pb-3 pt-6 sm:px-6 sm:pt-4">
          <DrawerTitle className="truncate text-right text-base sm:text-lg">
            فاتورة {invoice?.number ?? ""}
          </DrawerTitle>
          <DrawerClose>
            <Button type="button" variant="outline" size="sm">
              إغلاق
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8 sm:px-6 sm:pb-6">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          )}

          {!isLoading && isError && (
            <div className="rounded-2xl bg-destructive/10 p-4 text-center text-xs text-destructive">
              تعذّر تحميل الفاتورة.
              <button onClick={() => refetch()} className="mt-2 block w-full font-bold underline">
                إعادة المحاولة
              </button>
            </div>
          )}

          {!isLoading && invoice && (
            <>
              <div className="rounded-2xl border border-border bg-card p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{invoice.customer_name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{formatDate(invoice.date)}</p>
                  </div>
                  <Badge variant={invoice.status === "fully_paid" ? "success" : "warning"}>
                    {STATUS_LABEL[invoice.status] ?? invoice.status}
                  </Badge>
                </div>
                <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                  {invoice.company_name}
                  {invoice.tax_registration_no ? ` · الرقم الضريبي ${invoice.tax_registration_no}` : ""}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground">المنتجات</p>
                {invoice.lines.map((line) => (
                  <div key={line.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{line.product_name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {formatInvoiceQuantity(line.quantity)} × {formatInvoiceMoney(line.unit_price)}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold">
                      {formatInvoiceMoney(line.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {invoice.payments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-bold text-muted-foreground">الدفعات المحصَّلة</p>
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {formatDate(payment.collected_at)}
                        </p>
                        {payment.note && <p className="truncate text-[11px]">{payment.note}</p>}
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-primary">
                        {formatInvoiceMoney(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-1.5 rounded-2xl bg-muted/50 p-3">
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-bold text-muted-foreground">الإجمالي</span>
                  <span className="font-mono font-bold">{formatInvoiceMoney(invoice.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-bold text-muted-foreground">المحصَّل (ل.س)</span>
                  <span className="font-mono font-bold text-primary">{formatInvoiceMoney(invoice.paid_amount)}</span>
                </div>
                {Number(invoice.returned_amount) > 0 && (
                  <div className="flex items-center justify-between px-1 text-xs">
                    <span className="font-bold text-muted-foreground">المرتجعات</span>
                    <span className="font-mono font-bold">{formatInvoiceMoney(invoice.returned_amount)}</span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between rounded-xl bg-primary px-3 py-2.5 text-primary-foreground">
                  <span className="text-xs font-bold">المتبقي</span>
                  <span className="font-mono text-sm font-extrabold">{formatInvoiceMoney(invoice.balance_due)}</span>
                </div>
              </div>

              {invoice.notes && (
                <p className="mt-3 rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground">{invoice.notes}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShareMessage}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5 text-[11px] font-bold text-primary"
                >
                  <IconRenderer name="whatsapp_outlined" className="size-3.5" /> رسالة واتساب
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleSharePdf}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-[11px] font-bold text-primary-foreground disabled:opacity-60"
                >
                  <IconRenderer name="share_outlined" className="size-3.5" />
                  {isExporting ? "جارٍ التجهيز..." : "مشاركة PDF"}
                </button>
              </div>

              {isFetching && !isLoading && (
                <p className="mt-2 text-center text-[10px] text-muted-foreground">جارٍ التحديث...</p>
              )}

              <div style={{ position: "fixed", top: 0, left: -9999, zIndex: -1 }} aria-hidden="true">
                <InvoicePrintTemplate ref={printRef} invoice={invoice} />
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

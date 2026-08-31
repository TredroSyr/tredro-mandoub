"use client";

import { useMemo, useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreateReturnInvoiceMutation, useGetSalesInvoiceDetailQuery, useIssueReturnInvoiceMutation } from "../hooks";
import {
  REFUND_METHOD_OPTIONS,
  formatInvoiceMoney,
  formatInvoiceQuantity,
  isRefundMethodRequiredError,
} from "../lib/utils";

export function CreateReturnDrawer({
  invoiceId,
  invoiceNumber,
  open,
  onOpenChange,
}: {
  invoiceId: number | null;
  invoiceNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const { data, isLoading } = useGetSalesInvoiceDetailQuery(invoiceId, { enabled: open });
  const invoice = data?.data?.invoice;

  const eligibleLines = useMemo(
    () =>
      (invoice?.lines ?? [])
        .map((line) => {
          const qty = parseFloat(line.quantity) || 0;
          const returned = parseFloat(line.returned_quantity ?? "0") || 0;
          return { line, remaining: Math.max(0, qty - returned) };
        })
        .filter((entry) => entry.remaining > 0),
    [invoice],
  );

  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState("");
  const [pendingDraftId, setPendingDraftId] = useState<number | null>(null);
  const [refundMethodRequired, setRefundMethodRequired] = useState(false);

  // Reset the form whenever the drawer opens (for this or a different invoice) — not in an
  // effect, so React applies it in the same render instead of an extra pass.
  const resetKey = open ? invoiceId : null;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    if (open) {
      setQuantities({});
      setNotes("");
      setPendingDraftId(null);
      setRefundMethodRequired(false);
    }
  }

  const createDraft = useCreateReturnInvoiceMutation();
  const issue = useIssueReturnInvoiceMutation({
    onSuccess: () => onOpenChange(false),
    onError: (error) => {
      if (isRefundMethodRequiredError(error)) setRefundMethodRequired(true);
    },
  });

  const selectedLines = eligibleLines.filter(({ line }) => Number(quantities[line.id] || 0) > 0);
  const isPending = createDraft.isPending || issue.isPending;

  const submitDraft = () => {
    if (!invoice || selectedLines.length === 0) return;
    createDraft.mutate(
      {
        sales_invoice: invoice.id,
        notes: notes || undefined,
        lines: selectedLines.map(({ line }) => ({
          sales_invoice_line_id: line.id,
          quantity: quantities[line.id],
        })),
      },
      {
        onSuccess: (response) => {
          const returnInvoiceId = response.data.return_invoice.id;
          setPendingDraftId(returnInvoiceId);
          issue.mutate({ id: returnInvoiceId });
        },
      },
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={isMobile ? "down" : "left"}>
      <DrawerContent className="flex h-[92dvh] max-h-[92dvh] w-full flex-col rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl">
        <DrawerHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-3 border-b border-border bg-background px-4 pb-3 pt-6 sm:px-6 sm:pt-4">
          <DrawerTitle className="text-right text-base sm:text-lg">مرتجع — {invoiceNumber}</DrawerTitle>
          <DrawerClose>
            <Button type="button" variant="outline" size="sm">
              إغلاق
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8 sm:px-6 sm:pb-6">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          )}

          {!isLoading && refundMethodRequired && (
            <div className="space-y-2">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                قيمة المرتجع تتجاوز رصيد الفاتورة المتبقي — اختر طريقة استرجاع المبلغ الزائد.
              </p>
              {REFUND_METHOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => pendingDraftId && issue.mutate({ id: pendingDraftId, payload: { refund_method: option.value } })}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold disabled:opacity-50"
                >
                  {option.label}
                  <IconRenderer name="tick_outlined" className="size-3.5 text-primary" />
                </button>
              ))}
            </div>
          )}

          {!isLoading && !refundMethodRequired && (
            <>
              <p className="text-[11px] leading-relaxed text-muted-foreground">أدخل الكمية المُرجَعة لكل صنف.</p>

              {eligibleLines.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
                  لا توجد كميات قابلة للإرجاع على هذه الفاتورة.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {eligibleLines.map(({ line, remaining }) => (
                    <div key={line.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{line.product_name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          القابل للإرجاع {formatInvoiceQuantity(String(remaining))} ·{" "}
                          {formatInvoiceMoney(line.unit_price)}
                        </p>
                      </div>
                      <Input
                        value={quantities[line.id] ?? ""}
                        onChange={(e) => setQuantities((q) => ({ ...q, [line.id]: e.target.value }))}
                        inputMode="decimal"
                        dir="ltr"
                        placeholder="0"
                        className="w-20 text-center"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات (اختياري)"
                rows={2}
                className="mt-3"
              />

              <button
                type="button"
                disabled={selectedLines.length === 0 || isPending}
                onClick={submitDraft}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                <IconRenderer name="undo_outlined" className="size-4" />
                {isPending ? "جارٍ الحفظ..." : "تسجيل المرتجع"}
              </button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateInvoiceDrawer } from "@/module/invoices/components";
import { useAcceptCustomerRequestMutation, useRejectCustomerRequestMutation } from "../hooks";
import { CustomerRequest } from "../types";
import { formatRequestDate, formatRequestMoney, isRequestAnswerable, isRequestDeliverable } from "../lib/utils";
import { RequestStatusBadge } from "./request-status-badge";
import { RejectReasonDialog } from "./reject-reason-dialog";
import { RequestDetailDrawer } from "./request-detail-drawer";

export function RequestCard({ request }: { request: CustomerRequest }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const accept = useAcceptCustomerRequestMutation();
  const reject = useRejectCustomerRequestMutation({ onSuccess: () => setRejectOpen(false) });

  return (
    <article className="flex h-43 flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold">{request.customer_name}</h2>
            <p dir="ltr" className="truncate text-[11px] text-muted-foreground">
              {request.customer_phone}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {formatRequestDate(request.created_at)}
            </p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{request.line_count} صنف</span>
          <span className="font-mono text-xs font-extrabold text-primary">
            {formatRequestMoney(request.estimated_total)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 border-t border-border pt-3">
        <button
          onClick={() => setDetailOpen(true)}
          className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-[11px] font-bold text-muted-foreground"
        >
          <IconRenderer name="plus_circle_outlined" className="size-3.5" /> التفاصيل
        </button>

        <div className="flex items-center gap-1.5">
          {isRequestAnswerable(request.status) && (
            <>
              <button
                onClick={() => accept.mutate(request.id)}
                disabled={accept.isPending}
                className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
              >
                <IconRenderer name="tick_outlined" className="size-3.5" /> قبول
              </button>
              <button
                onClick={() => setRejectOpen(true)}
                disabled={reject.isPending}
                className="flex items-center gap-1 rounded-xl bg-destructive/12 px-3 py-2 text-[11px] font-bold text-destructive disabled:opacity-50"
              >
                <IconRenderer name="close_outlined" className="size-3.5" /> رفض
              </button>
            </>
          )}

          {isRequestDeliverable(request.status) && (
            <button
              onClick={() => setInvoiceOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground"
            >
              <IconRenderer name="checkout_outlined" className="size-3.5" /> إنشاء فاتورة
            </button>
          )}
        </div>
      </div>

      <RequestDetailDrawer open={detailOpen} onOpenChange={setDetailOpen} request={request} />

      <RejectReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        isPending={reject.isPending}
        onConfirm={(reason) => reject.mutate({ requestId: request.id, payload: { reason } })}
      />

      <CreateInvoiceDrawer
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        customerId={request.customer}
        prefill={{
          requestId: request.id,
          lines: request.lines.map((l) => ({ product_id: l.product, quantity: l.desired_quantity })),
        }}
      />
    </article>
  );
}

export function RequestCardSkeleton() {
  return (
    <article className="flex h-43 flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 border-t border-border pt-3">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-16 rounded-xl" />
          <Skeleton className="h-8 w-16 rounded-xl" />
        </div>
      </div>
    </article>
  );
}

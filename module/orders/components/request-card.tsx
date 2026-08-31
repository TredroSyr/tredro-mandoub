"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useAcceptCustomerRequestMutation, useRejectCustomerRequestMutation } from "../hooks";
import { CustomerRequest } from "../types";
import { formatRequestMoney, formatRequestQuantity, isRequestAnswerable, isRequestDeliverable } from "../lib/utils";
import { RequestStatusBadge } from "./request-status-badge";
import { RejectReasonDialog } from "./reject-reason-dialog";

export function RequestCard({ request }: { request: CustomerRequest }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const accept = useAcceptCustomerRequestMutation();
  const reject = useRejectCustomerRequestMutation({ onSuccess: () => setRejectOpen(false) });

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold">{request.customer_name}</h2>
          <p dir="ltr" className="truncate text-[11px] text-muted-foreground">
            {request.customer_phone}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {new Date(request.created_at).toLocaleDateString("ar-SY")}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      <ul className="mt-3 space-y-1.5">
        {request.lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-3 text-[11px]">
            <span className="truncate text-muted-foreground">{line.product_name}</span>
            <span className="shrink-0 font-mono">
              ×{formatRequestQuantity(line.desired_quantity)} {line.unit_name} · {formatRequestMoney(line.line_total)}
            </span>
          </li>
        ))}
      </ul>

      {request.notes && (
        <p className="mt-2 rounded-xl bg-muted/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          {request.notes}
        </p>
      )}

      {request.status === "rejected" && request.rejection_reason && (
        <p className="mt-2 rounded-xl bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
          {request.rejection_reason}
        </p>
      )}

      {request.status === "fulfilled" && request.fulfilled_by_invoice_number && (
        <p className="mt-2 rounded-xl bg-success/10 px-2.5 py-1.5 text-[11px] text-success">
          نُفِّذ عبر الفاتورة {request.fulfilled_by_invoice_number}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-xs font-extrabold text-primary">
          {formatRequestMoney(request.estimated_total)}
        </span>

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
            <span
              title="شاشة الفاتورة قيد الإنشاء"
              className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-[11px] font-bold text-muted-foreground"
            >
              <IconRenderer name="checkout_outlined" className="size-3.5" /> تم التسليم (قريباً)
            </span>
          )}
        </div>
      </div>

      <RejectReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        isPending={reject.isPending}
        onConfirm={(reason) => reject.mutate({ requestId: request.id, payload: { reason } })}
      />
    </article>
  );
}

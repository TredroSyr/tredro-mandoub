"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  useConfirmStockTransferMutation,
  useReceiveStockTransferMutation,
  useRejectStockTransferMutation,
} from "../hooks";
import { StockTransfer } from "../types";
import {
  formatTransferDate,
  formatTransferMoney,
  formatTransferQuantity,
  formatTransferTime,
  isReceivable,
  isReceived,
  needsRepConfirmation,
} from "../lib/utils";
import { TransferStatusBadge } from "./transfer-status-badge";

export function TransferCard({ transfer }: { transfer: StockTransfer }) {
  const confirm = useConfirmStockTransferMutation();
  const reject = useRejectStockTransferMutation();
  const receive = useReceiveStockTransferMutation();

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold">
            {formatTransferDate(transfer.requested_at)} · {formatTransferTime(transfer.requested_at)}
          </p>
          {transfer.pickup_within_hours != null && transfer.pickup_deadline && (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              مهلة الاستلام {transfer.pickup_within_hours} ساعة · حتى {formatTransferTime(transfer.pickup_deadline)}
            </p>
          )}
        </div>
        <TransferStatusBadge status={transfer.status} />
      </div>

      <ul className="mt-3 space-y-1.5">
        {transfer.lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-3 text-[11px]">
            <span className="truncate text-muted-foreground">{line.product_name}</span>
            <span className="shrink-0 font-mono">
              ×{formatTransferQuantity(line.effective_qty)} {line.unit_name} · {formatTransferMoney(line.line_total)}
            </span>
          </li>
        ))}
      </ul>

      {needsRepConfirmation(transfer.status) && (
        <p className="mt-2 rounded-xl bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary">
          أمين المستودع عدّل الكميات، راجعها قبل التأكيد.
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-xs font-extrabold text-primary">
          {formatTransferMoney(transfer.estimated_total)}
        </span>

        <div className="flex items-center gap-1.5">
          {needsRepConfirmation(transfer.status) && (
            <>
              <button
                onClick={() => confirm.mutate(transfer.id)}
                disabled={confirm.isPending}
                className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
              >
                <IconRenderer name="tick_outlined" className="size-3.5" /> قبول
              </button>
              <button
                onClick={() => reject.mutate(transfer.id)}
                disabled={reject.isPending}
                className="flex items-center gap-1 rounded-xl bg-destructive/12 px-3 py-2 text-[11px] font-bold text-destructive disabled:opacity-50"
              >
                <IconRenderer name="close_outlined" className="size-3.5" /> رفض
              </button>
            </>
          )}

          {isReceivable(transfer.status) && (
            <button
              onClick={() => receive.mutate(transfer.id)}
              disabled={receive.isPending}
              className="flex items-center gap-1 rounded-xl bg-success px-3 py-2 text-[11px] font-bold text-success-foreground disabled:opacity-50"
            >
              <IconRenderer name="checkout_outlined" className="size-3.5" /> استلمت البضاعة
            </button>
          )}

          {isReceived(transfer.status) && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-success">
              <IconRenderer name="tick_outlined" className="size-3.5" /> أُضيفت لمستودع السيارة
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

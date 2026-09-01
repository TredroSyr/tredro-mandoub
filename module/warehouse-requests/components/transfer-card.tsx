"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  useConfirmStockTransferMutation,
  useReceiveStockTransferMutation,
  useRejectStockTransferMutation,
} from "../hooks";
import { StockTransfer } from "../types";
import {
  formatTransferDate,
  formatTransferQuantity,
  formatTransferTime,
  isLineModified,
  isReceivable,
  isReceived,
  needsRepConfirmation,
  translateUnitName,
} from "../lib/utils";
import { TransferStatusBadge } from "./transfer-status-badge";
import { TransferDetailDrawer } from "./transfer-detail-drawer";

const MAX_VISIBLE_LINES = 3;

export function TransferCard({ transfer }: { transfer: StockTransfer }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const confirm = useConfirmStockTransferMutation();
  const reject = useRejectStockTransferMutation();
  const receive = useReceiveStockTransferMutation();

  const visibleLines = transfer.lines.slice(0, MAX_VISIBLE_LINES);
  const hasMoreLines = transfer.lines.length > MAX_VISIBLE_LINES;

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div onClick={() => setDetailOpen(true)} className="cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold">
              {formatTransferDate(transfer.requested_at)} ·{" "}
              {formatTransferTime(transfer.requested_at)}
            </p>
            {transfer.pickup_within_hours != null &&
              transfer.pickup_deadline && (
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  مهلة الاستلام {transfer.pickup_within_hours} ساعة · حتى{" "}
                  {formatTransferTime(transfer.pickup_deadline)}
                </p>
              )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <TransferStatusBadge status={transfer.status} />
            <IconRenderer
              name="arrow_left_outlined"
              className="size-4 text-muted-foreground"
            />
          </div>
        </div>

        <ul className="mt-3 space-y-1.5">
          {visibleLines.map((line) => (
            <li
              key={line.id}
              className="flex items-center justify-between gap-3 text-[11px]"
            >
              <span className="truncate text-muted-foreground">
                {line.product_name}
              </span>
              {isLineModified(line) ? (
                <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono font-bold text-primary">
                  {formatTransferQuantity(line.requested_qty)} →{" "}
                  {formatTransferQuantity(line.effective_qty)}{" "}
                  {translateUnitName(line.unit_name)}
                </span>
              ) : (
                <span className="shrink-0 font-mono">
                  ×{formatTransferQuantity(line.effective_qty)}{" "}
                  {translateUnitName(line.unit_name)}
                </span>
              )}
            </li>
          ))}
        </ul>

        {hasMoreLines && (
          <p className="mt-1.5 text-[11px] font-bold text-primary">
            ...... عرض المزيد
          </p>
        )}

        {needsRepConfirmation(transfer.status) && (
          <p className="mt-2 rounded-xl bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary">
            الشركة عدّلت الكميات، راجعها قبل التأكيد.
          </p>
        )}

        <div className="mt-3 flex items-center justify-end border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            {needsRepConfirmation(transfer.status) && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirm.mutate(transfer.id);
                  }}
                  disabled={confirm.isPending}
                  className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
                >
                  <IconRenderer name="tick_outlined" className="size-3.5" />{" "}
                  قبول
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reject.mutate(transfer.id);
                  }}
                  disabled={reject.isPending}
                  className="flex items-center gap-1 rounded-xl bg-destructive/12 px-3 py-2 text-[11px] font-bold text-destructive disabled:opacity-50"
                >
                  <IconRenderer name="close_outlined" className="size-3.5" />{" "}
                  رفض
                </button>
              </>
            )}

            {isReceivable(transfer.status) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  receive.mutate(transfer.id);
                }}
                disabled={receive.isPending}
                className="flex items-center gap-1 rounded-xl border border-success px-3 py-2 text-[11px] font-bold text-success-foreground disabled:opacity-50"
              >
                <IconRenderer
                  name="tick_filled"
                  className="size-3.5 text-success"
                />{" "}
                استلمت البضاعة
              </button>
            )}

            {isReceived(transfer.status) && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                <IconRenderer name="tick_filled" className="size-3.5" /> أُضيفت
                لمستودع السيارة
              </span>
            )}
          </div>
        </div>
      </div>

      <TransferDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        transfer={transfer}
      />
    </article>
  );
}

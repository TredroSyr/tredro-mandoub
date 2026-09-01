"use client";

import { useMemo } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  useConfirmStockTransferMutation,
  useGetRepProductsQuery,
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

export function TransferDetailDrawer({
  open,
  onOpenChange,
  transfer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: StockTransfer | null;
}) {
  const products = useGetRepProductsQuery(
    { page_size: 200 },
    { enabled: open },
  );
  const confirm = useConfirmStockTransferMutation();
  const reject = useRejectStockTransferMutation();
  const receive = useReceiveStockTransferMutation();

  const productImages = useMemo(() => {
    const map: Record<number, string | null> = {};
    for (const p of products.data?.data?.products ?? []) map[p.id] = p.image;
    return map;
  }, [products.data]);

  if (!transfer) return null;

  const showActions =
    needsRepConfirmation(transfer.status) ||
    isReceivable(transfer.status) ||
    isReceived(transfer.status);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mt-0 flex h-[85svh] flex-col rounded-t-[1.75rem] border-t border-border bg-card">
        <DrawerHeader className="flex shrink-0 flex-col gap-3 border-b border-border pb-4 text-start">
          <div className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="font-mono text-sm font-extrabold">
                {transfer.number}
              </DrawerTitle>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {formatTransferDate(transfer.requested_at)} ·{" "}
                {formatTransferTime(transfer.requested_at)}
              </p>
              <div className="mt-2">
                <TransferStatusBadge status={transfer.status} />
              </div>
            </div>
            <DrawerClose>
              <Button variant="secondary" size="icon-sm" className="shrink-0">
                <IconRenderer name="close_outlined" className="size-3.5" />
              </Button>
            </DrawerClose>
          </div>

          {needsRepConfirmation(transfer.status) && (
            <p className="rounded-xl bg-primary/10 px-3 py-2 text-[11px] text-primary">
              الشركة عدّلت الكميات، راجعها قبل التأكيد.
            </p>
          )}

          {showActions && (
            <div className="flex items-center gap-1.5">
              {needsRepConfirmation(transfer.status) && (
                <>
                  <button
                    onClick={() => confirm.mutate(transfer.id)}
                    disabled={confirm.isPending}
                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    <IconRenderer name="tick_outlined" className="size-3.5" />{" "}
                    قبول
                  </button>
                  <button
                    onClick={() => reject.mutate(transfer.id)}
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
                  onClick={() => receive.mutate(transfer.id)}
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
                  <IconRenderer name="tick_filled" className="size-3.5" />{" "}
                  أُضيفت لمستودع السيارة
                </span>
              )}
            </div>
          )}
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
          {transfer.pickup_within_hours != null && transfer.pickup_deadline && (
            <p className="mb-3 rounded-xl bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
              مهلة الاستلام {transfer.pickup_within_hours} ساعة · حتى{" "}
              {formatTransferTime(transfer.pickup_deadline)}
            </p>
          )}

          <div className="space-y-2">
            {transfer.lines.map((line) => {
              const image = productImages[line.product];
              const modified = isLineModified(line);
              return (
                <div
                  key={line.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
                >
                  <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={line.product_name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <IconRenderer
                        name="no_image_outlined"
                        className="size-5 text-muted-foreground"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">
                      {line.product_name}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {line.product_sku}
                    </p>
                  </div>

                  <div className="shrink-0 text-end">
                    {modified ? (
                      <p className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary">
                        {formatTransferQuantity(line.requested_qty)} →{" "}
                        {formatTransferQuantity(line.effective_qty)}{" "}
                        {translateUnitName(line.unit_name)}
                      </p>
                    ) : (
                      <p className="font-mono text-[11px] font-bold">
                        ×{formatTransferQuantity(line.effective_qty)}{" "}
                        {translateUnitName(line.unit_name)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {transfer.notes && (
            <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
              {transfer.notes}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

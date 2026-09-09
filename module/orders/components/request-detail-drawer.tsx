"use client";

import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { CustomerRequest } from "../types";
import { formatRequestDate, formatRequestMoney, formatRequestQuantity, translateUnitName } from "../lib/utils";
import { RequestStatusBadge } from "./request-status-badge";

export function RequestDetailDrawer({
  open,
  onOpenChange,
  request,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CustomerRequest | null;
}) {
  if (!request) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        avoidBottomNav
        className="mt-0 flex h-[85svh] max-h-[85svh] flex-col rounded-t-[1.75rem] border-t border-border bg-card"
      >
        <DrawerHeader className="flex shrink-0 flex-col gap-3 border-b border-border pb-4 text-start">
          <div className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="truncate text-sm font-extrabold">{request.customer_name}</DrawerTitle>
              <p dir="ltr" className="mt-0.5 truncate text-end text-[11px] text-muted-foreground">
                {request.customer_phone}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {formatRequestDate(request.created_at)}
              </p>
              <div className="mt-2">
                <RequestStatusBadge status={request.status} />
              </div>
            </div>
            <DrawerClose>
              <Button variant="secondary" size="icon-sm" className="shrink-0">
                <IconRenderer name="close_outlined" className="size-3.5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
          <div className="space-y-2">
            {request.lines.map((line) => (
              <div key={line.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{line.product_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{line.product_sku}</p>
                </div>

                <div className="shrink-0 text-end">
                  <p className="font-mono text-[11px] font-bold">
                    ×{formatRequestQuantity(line.desired_quantity)} {translateUnitName(line.unit_name)}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">{formatRequestMoney(line.line_total)}</p>
                </div>
              </div>
            ))}
          </div>

          {request.notes && (
            <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">{request.notes}</p>
          )}

          {request.status === "rejected" && request.rejection_reason && (
            <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
              {request.rejection_reason}
            </p>
          )}

          {request.status === "fulfilled" && request.fulfilled_by_invoice_number && (
            <p className="mt-3 rounded-xl bg-success/10 px-3 py-2 text-[11px] text-success">
              نُفِّذ عبر الفاتورة {request.fulfilled_by_invoice_number}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-3">
          <span className="text-[11px] font-bold text-muted-foreground">الإجمالي التقديري</span>
          <span className="font-mono text-sm font-extrabold text-primary">
            {formatRequestMoney(request.estimated_total)}
          </span>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { formatCurrency, formatDate } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ReturnInvoice } from "@/module/customers/types";

const STATUS_LABEL: Record<string, string> = {
  issued: "صادر",
  draft: "مسودة",
  cancelled: "ملغى",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 text-xs">
      <span className="font-bold text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-left font-mono font-bold">{value}</span>
    </div>
  );
}

export function ReturnDetailDrawer({
  item,
  open,
  onOpenChange,
}: {
  item: ReturnInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={isMobile ? "down" : "left"}>
      <DrawerContent
        avoidBottomNav
        className="flex w-full flex-col rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl"
      >
        <DrawerHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-3 border-b border-border bg-background px-4 pb-3 pt-6 sm:px-6 sm:pt-4">
          <DrawerTitle className="truncate text-right text-base sm:text-lg">مرتجع {item?.number ?? ""}</DrawerTitle>
          <DrawerClose>
            <Button type="button" variant="outline" size="sm">
              إغلاق
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8 sm:px-6 sm:pb-6">
          {item && (
            <>
              <div className="rounded-2xl border border-border bg-card p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-bold">{item.number}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{formatDate(item.date)}</p>
                  </div>
                  <Badge variant={item.status === "issued" ? "success" : "warning"}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                </div>
                <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                  {item.company_name}
                  {item.tax_registration_no ? ` · الرقم الضريبي ${item.tax_registration_no}` : ""}
                </p>
              </div>

              <div className="mt-3 space-y-2 rounded-2xl bg-muted/50 p-3">
                <Row label="الفاتورة المرتبطة" value={item.sales_invoice_number} />
                <Row label="المندوب" value={item.rep_name} />
                <Row label="المستودع" value={item.warehouse_name} />
                <Row label="تاريخ الإصدار" value={item.issued_at ? formatDate(item.issued_at) : null} />
                <Row label="طريقة الاسترداد" value={item.refund_method} />
              </div>

              <div className="mt-3 space-y-1.5 rounded-2xl bg-muted/50 p-3">
                {Number(item.overage_amount) > 0 && (
                  <div className="flex items-center justify-between px-1 text-xs">
                    <span className="font-bold text-muted-foreground">مبلغ الزيادة</span>
                    <span className="font-mono font-bold">{formatCurrency(item.overage_amount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-xl bg-primary px-3 py-2.5 text-primary-foreground">
                  <span className="text-xs font-bold">قيمة المرتجع</span>
                  <span className="font-mono text-sm font-extrabold">{formatCurrency(item.amount)}</span>
                </div>
              </div>

              {item.notes && (
                <p className="mt-3 rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground">{item.notes}</p>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

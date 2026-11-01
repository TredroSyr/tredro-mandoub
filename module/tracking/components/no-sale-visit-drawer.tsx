"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { NoSaleReason } from "../api";
import { useCreateVisitMutation } from "../hooks";

const REASONS: { value: NoSaleReason; label: string }[] = [
  { value: "shop_closed", label: "المحل مغلق" },
  { value: "owner_absent", label: "صاحب المحل غير موجود" },
  { value: "enough_stock", label: "لديه بضاعة كافية" },
  { value: "come_back_later", label: "طلب العودة لاحقاً" },
  { value: "other", label: "سبب آخر" },
];

/** Button + drawer on the store page: the rep visited but nothing was sold. */
export function NoSaleVisitButton({ customerId }: { customerId: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-muted-foreground"
      >
        <IconRenderer name="block_outlined" className="size-4" /> زيارة دون بيع
      </button>
      {open && <NoSaleVisitDrawer customerId={customerId} open={open} onOpenChange={setOpen} />}
    </>
  );
}

function NoSaleVisitDrawer({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [reason, setReason] = useState<NoSaleReason | null>(null);
  const [note, setNote] = useState("");
  const mutation = useCreateVisitMutation({ onDone: () => onOpenChange(false) });
  const noteMissing = reason === "other" && !note.trim();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={isMobile ? "down" : "left"}>
      <DrawerContent
        avoidBottomNav
        className="flex w-full flex-col rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl"
      >
        <DrawerHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-3 border-b border-border bg-background px-4 pb-3 pt-6 sm:px-6 sm:pt-4">
          <DrawerTitle className="text-right text-base sm:text-lg">زيارة دون بيع</DrawerTitle>
          <DrawerClose>
            <Button type="button" variant="outline" size="sm">
              إغلاق
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8 sm:px-6 sm:pb-6">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            سجّل سبب عدم البيع حتى تظهر الزيارة للشركة على خط سيرك.
          </p>
          <div className="mt-3 space-y-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border bg-card px-4 py-3 text-xs font-bold",
                  reason === r.value ? "border-primary text-primary" : "border-border",
                )}
              >
                {r.label}
                {reason === r.value && <IconRenderer name="tick_outlined" className="size-3.5" />}
              </button>
            ))}
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={reason === "other" ? "اكتب السبب (مطلوب)" : "ملاحظات (اختياري)"}
            rows={2}
            className="mt-3"
          />

          <button
            type="button"
            disabled={!reason || noteMissing || mutation.isPending}
            onClick={() => reason && mutation.mutate({ customer: customerId, outcome: "no_sale", reason, note: note.trim() })}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
          >
            <IconRenderer name="block_outlined" className="size-4" />
            {mutation.isPending ? "جارٍ الحفظ..." : "تسجيل الزيارة"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePaymentMutation } from "../hooks";
import { formatInvoiceMoney } from "../lib/utils";
import type { SalesInvoice } from "../types";

/** Only what the dialog shows — lets a queued payment be re-opened without the full invoice. */
export type PaymentTarget = Pick<SalesInvoice, "id" | "number" | "customer_name" | "balance_due">;

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
  initialAmount,
  initialNote,
  replacesOutboxId,
}: {
  invoice: PaymentTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Re-opening a queued payment: values to pre-fill. */
  initialAmount?: string;
  initialNote?: string;
  /** Outbox item being edited — deleted once this resubmission is accepted or re-queued. */
  replacesOutboxId?: string;
}) {
  const [amount, setAmount] = useState(initialAmount ?? "");
  const [note, setNote] = useState(initialNote ?? "");

  const record = useCreatePaymentMutation({
    replacesOutboxId,
    onSuccess: () => {
      setAmount("");
      setNote("");
      onOpenChange(false);
    },
    onQueued: () => {
      setAmount("");
      setNote("");
      onOpenChange(false);
    },
  });

  if (!invoice) return null;

  const submit = () => {
    if (!amount || Number(amount) <= 0) return;
    record.mutate({ sales_invoice: invoice.id, amount, note: note || undefined });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setAmount("");
          setNote("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل دفعة — {invoice.number}</DialogTitle>
          <DialogDescription>
            {invoice.customer_name}
            {invoice.balance_due ? ` · الرصيد المتبقي ${formatInvoiceMoney(invoice.balance_due)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          dir="ltr"
          placeholder={invoice.balance_due ? `الحد الأقصى ${formatInvoiceMoney(invoice.balance_due)}` : "المبلغ"}
        />

        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة (اختياري)" rows={2} />

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>إلغاء</DialogClose>
          <Button disabled={record.isPending || !amount} onClick={submit}>
            <IconRenderer name="money_outlined" className="size-3.5" /> تسجيل الدفعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { useCreateInvoicePaymentMutation } from "../hooks";
import { formatInvoiceMoney } from "../lib/utils";
import type { SalesInvoice } from "../types";

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: SalesInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const record = useCreateInvoicePaymentMutation({
    onSuccess: () => {
      setAmount("");
      setNote("");
      onOpenChange(false);
    },
  });

  if (!invoice) return null;

  const submit = () => {
    if (!amount || Number(amount) <= 0) return;
    record.mutate({ invoiceId: invoice.id, payload: { amount, note: note || undefined } });
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
            {invoice.customer_name} · الرصيد المتبقي {formatInvoiceMoney(invoice.balance_due)}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          dir="ltr"
          placeholder={`الحد الأقصى ${formatInvoiceMoney(invoice.balance_due)}`}
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

"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGetRepProductsQuery } from "@/module/warehouse-requests/hooks";
import { useCreateSalesInvoiceMutation } from "../hooks";
import { formatInvoiceMoney } from "../lib/utils";
import type { SalesInvoiceDetail } from "../types";
import { InvoiceLinePicker } from "./invoice-line-picker";

export interface InvoiceRequestPrefill {
  requestId: number;
  lines: { product_id: number; quantity: string }[];
}

/** Imperative handle so the drawer's header Save button can trigger submission from outside the form. */
export interface CreateInvoiceFormHandle {
  submit: () => void;
}

export interface CreateInvoiceFormState {
  canSubmit: boolean;
  isPending: boolean;
}

export const CreateInvoiceForm = forwardRef<
  CreateInvoiceFormHandle,
  {
    customerId: number;
    prefill?: InvoiceRequestPrefill;
    onSuccess?: (invoice: SalesInvoiceDetail) => void;
    onStateChange?: (state: CreateInvoiceFormState) => void;
  }
>(function CreateInvoiceForm({ customerId, prefill, onSuccess, onStateChange }, ref) {
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>(() =>
    Object.fromEntries((prefill?.lines ?? []).map((l) => [l.product_id, parseFloat(l.quantity) || 0])),
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [shortage, setShortage] = useState<{ productId: number; available: string; requested: string } | null>(
    null,
  );

  const { data, isLoading } = useGetRepProductsQuery({
    search: search || undefined,
    is_sellable: true,
    page_size: 100,
  });
  const products = useMemo(() => data?.data?.products ?? [], [data]);

  const create = useCreateSalesInvoiceMutation({
    onSuccess: (invoice) => {
      setQuantities({});
      setPaymentAmount("");
      setNotes("");
      setShortage(null);
      onSuccess?.(invoice);
    },
    onError: (error) => {
      const errors = error.response?.data?.errors;
      if (errors?.product_id && errors?.available && errors?.requested) {
        setShortage({
          productId: Number(errors.product_id[0]),
          available: errors.available[0],
          requested: errors.requested[0],
        });
      }
    },
  });

  const selectedLines = useMemo(
    () =>
      products
        .filter((p) => (quantities[p.id] ?? 0) > 0)
        .map((p) => ({ product: p, quantity: quantities[p.id]! })),
    [products, quantities],
  );

  const total = selectedLines.reduce(
    (sum, { product, quantity }) => sum + (product.price ? parseFloat(product.price) : 0) * quantity,
    0,
  );
  const collected = parseFloat(paymentAmount) || 0;
  const remaining = Math.max(0, total - collected);

  const shortageProductName = shortage ? products.find((p) => p.id === shortage.productId)?.name : null;

  const submit = () => {
    if (selectedLines.length === 0) return;
    setShortage(null);
    create.mutate({
      customer_id: customerId,
      lines: selectedLines.map(({ product, quantity }) => ({
        product_id: product.id,
        quantity: String(quantity),
      })),
      payment_amount: paymentAmount || undefined,
      notes: notes || undefined,
      fulfils_request_ids: prefill ? [prefill.requestId] : undefined,
    });
  };

  useImperativeHandle(ref, () => ({ submit }));

  const canSubmit = selectedLines.length > 0;
  useEffect(() => {
    onStateChange?.({ canSubmit, isPending: create.isPending });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit, create.isPending]);

  return (
    <div>
      {shortage && (
        <p className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          الكمية المتوفرة من {shortageProductName ?? "هذا المنتج"} بالسيارة {shortage.available} فقط، والمطلوب{" "}
          {shortage.requested}.
        </p>
      )}

      <InvoiceLinePicker
        products={products}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        quantities={quantities}
        onQuantityChange={(productId, quantity) => setQuantities((q) => ({ ...q, [productId]: quantity }))}
      />

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-primary">المبلغ المحصَّل الآن (اختياري)</label>
          <Input
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            inputMode="decimal"
            dir="ltr"
            placeholder="0"
          />
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات (اختياري)"
          rows={2}
        />
      </div>

      <div className="mt-4 space-y-1.5 rounded-2xl bg-muted/50 p-3">
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-bold text-muted-foreground">الإجمالي</span>
          <span className="font-mono font-bold">{formatInvoiceMoney(String(total))}</span>
        </div>
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-bold text-muted-foreground">المبلغ المحصَّل (ل.س)</span>
          <span className="font-mono font-bold text-primary">{formatInvoiceMoney(String(collected))}</span>
        </div>
        <div className="mt-1 flex items-center justify-between rounded-xl bg-primary px-3 py-2.5 text-primary-foreground">
          <span className="text-xs font-bold">المتبقي</span>
          <span className="font-mono text-sm font-extrabold">{formatInvoiceMoney(String(remaining))}</span>
        </div>
      </div>
    </div>
  );
});

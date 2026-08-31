"use client";

import { useMemo, useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
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

export function CreateInvoiceForm({
  customerId,
  prefill,
  onSuccess,
}: {
  customerId: number;
  prefill?: InvoiceRequestPrefill;
  onSuccess?: (invoice: SalesInvoiceDetail) => void;
}) {
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

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
        <span className="text-xs font-bold">الإجمالي</span>
        <span className="font-mono text-sm font-extrabold">{formatInvoiceMoney(String(total))}</span>
      </div>

      <button
        type="button"
        disabled={selectedLines.length === 0 || create.isPending}
        onClick={submit}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
      >
        <IconRenderer name="checkout_outlined" className="size-4" />
        {create.isPending ? "جارٍ الحفظ..." : "إنشاء الفاتورة"}
      </button>
    </div>
  );
}

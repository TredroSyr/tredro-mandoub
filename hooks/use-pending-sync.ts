"use client";

import { useMemo } from "react";
import type { OutboxItem } from "@/lib/db/outbox";
import { useOutboxItems } from "@/lib/sync/outbox-store";

/** What each queued action is called on screen ("استلام البضاعة — بانتظار المزامنة"). */
const ACTION_LABELS: Record<string, string> = {
  receive_stock_transfer: "استلام البضاعة",
  confirm_stock_transfer: "قبول الكميات المعدّلة",
  reject_stock_transfer: "رفض الطلب",
  accept_customer_request: "قبول الطلب",
  reject_customer_request: "رفض الطلب",
  create_sales_invoice: "إنشاء الفاتورة",
  create_payment: "تسجيل الدفعة",
  issue_return_invoice: "ترحيل المرتجع",
  update_customer: "تعديل بيانات المحل",
  update_rep_work_days: "تعديل أيام العمل",
  create_stock_transfer: "طلب البضاعة",
  create_customer: "إضافة المحل",
};

export function describeAction(kind: string): string {
  return ACTION_LABELS[kind] ?? "الإجراء";
}

type Payload = Record<string, unknown>;
const payloadOf = (item: OutboxItem): Payload => (item.payload ?? {}) as Payload;

const TRANSFER_ACTIONS = new Set([
  "receive_stock_transfer",
  "confirm_stock_transfer",
  "reject_stock_transfer",
]);

/** The queued receive / confirm / reject for this stock transfer, if any (pending OR failed). */
export function usePendingTransferAction(transferId: number): OutboxItem | null {
  const items = useOutboxItems();
  return useMemo(
    () =>
      items.find(
        (i) => TRANSFER_ACTIONS.has(i.kind) && payloadOf(i).transferId === transferId,
      ) ?? null,
    [items, transferId],
  );
}

/**
 * The queued accept / reject — or an invoice created to fulfil it — for this
 * customer request. Any of them changes what the request card should offer.
 */
export function usePendingRequestAction(requestId: number): OutboxItem | null {
  const items = useOutboxItems();
  return useMemo(
    () =>
      items.find((i) => {
        const p = payloadOf(i);
        if (i.kind === "accept_customer_request" || i.kind === "reject_customer_request") {
          return p.requestId === requestId;
        }
        if (i.kind === "create_sales_invoice") {
          return Array.isArray(p.fulfils_request_ids) && p.fulfils_request_ids.includes(requestId);
        }
        return false;
      }) ?? null,
    [items, requestId],
  );
}

/** Payments queued against this invoice — its balance on screen doesn't include them yet. */
export function usePendingPayments(invoiceId: number | null): OutboxItem[] {
  const items = useOutboxItems();
  return useMemo(
    () =>
      invoiceId == null
        ? []
        : items.filter((i) => i.kind === "create_payment" && payloadOf(i).sales_invoice === invoiceId),
    [items, invoiceId],
  );
}

/** Invoices and edits queued for this customer — what the store screen doesn't show yet. */
export function usePendingCustomerChanges(customerId: number | null): OutboxItem[] {
  const items = useOutboxItems();
  return useMemo(
    () =>
      customerId == null
        ? []
        : items.filter((i) => {
            const p = payloadOf(i);
            return (
              (i.kind === "create_sales_invoice" && p.customer_id === customerId) ||
              (i.kind === "update_customer" && p.customerId === customerId)
            );
          }),
    [items, customerId],
  );
}

/** Everything queued of the given kinds — for list screens that don't show them yet. */
export function usePendingOfKinds(kinds: string[]): OutboxItem[] {
  const items = useOutboxItems();
  const key = kinds.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => items.filter((i) => kinds.includes(i.kind)), [items, key]);
}

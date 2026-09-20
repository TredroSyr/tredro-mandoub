import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/module/auth/types";
import { formatAmount, formatDate } from "@/lib/format";
import type { SalesInvoiceDetail } from "../types";

/** Latin (Western) digits everywhere, even inside Arabic-locale formatting — matches lib/format.ts. */
const NUMBERING_SYSTEM = { numberingSystem: "latn" } as const;

/** Money strings from the API can be null — never render null as 0. */
export function formatInvoiceMoney(value: string | null): string {
  if (value == null) return "بدون سعر";
  return `${formatAmount(value)} ل.س`;
}

export function formatInvoiceQuantity(value: string): string {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toLocaleString("ar-SY", NUMBERING_SYSTEM) : value;
}

const INVOICE_STATUS_LABEL: Record<string, string> = {
  fully_paid: "مدفوعة",
  partially_paid: "معلّقة",
  deferred: "آجلة",
};

/** Full WhatsApp text for an invoice: header, customer, every product line, payments and totals. */
export function buildInvoiceWhatsAppMessage(invoice: SalesInvoiceDetail): string {
  const lines: string[] = [];

  lines.push(`🧾 *فاتورة ${invoice.number}*`);
  lines.push(invoice.company_name);
  if (invoice.tax_registration_no) lines.push(`الرقم الضريبي: ${invoice.tax_registration_no}`);
  lines.push("");
  lines.push(`العميل: ${invoice.customer_name}`);
  lines.push(`التاريخ: ${formatDate(invoice.date)}`);
  if (invoice.rep_name) lines.push(`المندوب: ${invoice.rep_name}`);
  lines.push(`الحالة: ${INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}`);

  lines.push("");
  lines.push("*المنتجات:*");
  invoice.lines.forEach((line, index) => {
    const unit = line.unit_name ? ` ${line.unit_name}` : "";
    lines.push(`${index + 1}. ${line.product_name}`);
    lines.push(
      `    ${formatInvoiceQuantity(line.quantity)}${unit} × ${formatInvoiceMoney(line.unit_price)} = ${formatInvoiceMoney(line.subtotal)}`,
    );
  });

  if (invoice.payments.length > 0) {
    lines.push("");
    lines.push("*الدفعات المحصَّلة:*");
    invoice.payments.forEach((payment) => {
      const note = payment.note ? ` (${payment.note})` : "";
      lines.push(`• ${formatDate(payment.collected_at)}: ${formatInvoiceMoney(payment.amount)}${note}`);
    });
  }

  lines.push("");
  lines.push(`الإجمالي: ${formatInvoiceMoney(invoice.total_amount)}`);
  lines.push(`المحصَّل: ${formatInvoiceMoney(invoice.paid_amount)}`);
  if (Number(invoice.returned_amount) > 0) {
    lines.push(`المرتجعات: ${formatInvoiceMoney(invoice.returned_amount)}`);
  }
  lines.push(`*المتبقي: ${formatInvoiceMoney(invoice.balance_due)}*`);

  if (invoice.notes) {
    lines.push("");
    lines.push(`ملاحظات: ${invoice.notes}`);
  }

  return lines.join("\n");
}

/** The server asks for a refund method only when a return would overdraw the invoice's remaining balance. */
export function isRefundMethodRequiredError(error: AxiosError<ApiErrorResponse>): boolean {
  return !!error.response?.data?.errors?.refund_method;
}

export const REFUND_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "cash_refunded_by_rep", label: "استرجاع نقدي من المندوب" },
  { value: "deferred_customer_credit", label: "رصيد مؤجل للعميل" },
];

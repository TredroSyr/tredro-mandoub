import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/module/auth/types";

/** Money strings from the API can be null — never render null as 0. */
export function formatInvoiceMoney(value: string | null): string {
  if (value == null) return "بدون سعر";
  const n = parseFloat(value);
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("ar-SY")} ل.س`;
}

export function formatInvoiceQuantity(value: string): string {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toLocaleString("ar-SY") : value;
}

/** The server asks for a refund method only when a return would overdraw the invoice's remaining balance. */
export function isRefundMethodRequiredError(error: AxiosError<ApiErrorResponse>): boolean {
  return !!error.response?.data?.errors?.refund_method;
}

export const REFUND_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "cash_refunded_by_rep", label: "استرجاع نقدي من المندوب" },
  { value: "deferred_customer_credit", label: "رصيد مؤجل للعميل" },
];

import type { ReturnInvoice, SalesInvoice, SalesInvoicesResponse } from "@/module/customers/types";

export type { SalesInvoice, ReturnInvoice, SalesInvoicesResponse };

export interface SalesInvoicesListParams {
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface SalesInvoiceLine {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  unit: number;
  unit_name: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
  tax_rate: string;
  /** Confirmed on the admin API; unconfirmed for the rep endpoint — treat as absent, not 0, if missing. */
  returned_quantity?: string | null;
}

export interface InvoicePayment {
  id: number;
  sales_invoice: number;
  sales_invoice_number: string;
  amount: string;
  collected_by: number | null;
  collected_by_name: string | null;
  collected_at: string;
  source: string;
  applied_credit: number | null;
  note: string;
  created_at: string;
}

export interface SalesInvoiceReturnSummary {
  id: number;
  number: string;
  status: string;
  amount: string;
  overage_amount: string;
  refund_method: string;
  issued_at: string | null;
}

export interface SalesInvoiceDetail extends SalesInvoice {
  lines: SalesInvoiceLine[];
  payments: InvoicePayment[];
  returns: SalesInvoiceReturnSummary[];
  fulfilled_request_ids: number[];
}

export interface SalesInvoiceDetailResponse {
  success: boolean;
  message: string;
  data: { invoice: SalesInvoiceDetail };
}

export interface CreateSalesInvoiceLinePayload {
  product_id: number;
  quantity: string;
  unit_price?: string;
  tax_rate?: string;
}

export interface CreateSalesInvoicePayload {
  customer_id: number;
  lines: CreateSalesInvoiceLinePayload[];
  payment_amount?: string;
  payment_collected_at?: string;
  fulfils_request_ids?: number[];
  credit_ids?: number[];
  date?: string;
  currency?: string;
  notes?: string;
  // no `warehouse` field — never send it, it defaults to the rep's own van
}

export type CreateSalesInvoiceResponse = SalesInvoiceDetailResponse;

export interface CreateInvoicePaymentPayload {
  amount: string;
  /** Optional — defaults server-side to the requesting user when omitted. */
  collected_by?: number;
  collected_at?: string;
  note?: string;
}

export interface CreateInvoicePaymentResponse {
  success: boolean;
  message: string;
  data: { payment: InvoicePayment; invoice: SalesInvoiceDetail };
}

export type RefundMethod = "cash_refunded_by_rep" | "deferred_customer_credit" | string;

export interface CreateReturnInvoiceLinePayload {
  sales_invoice_line_id: number;
  quantity: string;
}

export interface CreateReturnInvoicePayload {
  sales_invoice: number;
  lines: CreateReturnInvoiceLinePayload[];
  notes?: string;
}

export interface CreateReturnInvoiceResponse {
  success: boolean;
  message: string;
  data: { return_invoice: ReturnInvoice };
}

export interface IssueReturnInvoicePayload {
  refund_method?: RefundMethod;
}

export interface IssueReturnInvoiceResponse {
  success: boolean;
  message: string;
  data: { return_invoice: ReturnInvoice; invoice: SalesInvoiceDetail };
}

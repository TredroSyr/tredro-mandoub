import api from "@/lib/axios";
import {
  CreateInvoicePaymentPayload,
  CreateInvoicePaymentResponse,
  CreateReturnInvoicePayload,
  CreateReturnInvoiceResponse,
  CreateSalesInvoicePayload,
  CreateSalesInvoiceResponse,
  IssueReturnInvoicePayload,
  IssueReturnInvoiceResponse,
  SalesInvoiceDetailResponse,
  SalesInvoicesListParams,
  SalesInvoicesResponse,
} from "../types";

/** Unscoped — omitting `customer` (unlike the per-store list) returns every sales invoice for the rep. */
export const getSalesInvoices = async (
  params?: SalesInvoicesListParams,
): Promise<SalesInvoicesResponse> => {
  const response = await api.get("/reps/sales-invoices/", { params });
  return response.data;
};

/** Confirmed (frontend4.md §10). */
export const createSalesInvoice = async (
  payload: CreateSalesInvoicePayload,
): Promise<CreateSalesInvoiceResponse> => {
  const response = await api.post("/reps/sales-invoices/", payload, {
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  return response.data;
};

export const getSalesInvoiceDetail = async (
  invoiceId: number,
): Promise<SalesInvoiceDetailResponse> => {
  const response = await api.get(`/reps/sales-invoices/${invoiceId}/`);
  return response.data;
};

/** Confirmed contract: POST /invoices/{invoice_id}/payments/. */
export const createInvoicePayment = async (
  invoiceId: number,
  payload: CreateInvoicePaymentPayload,
): Promise<CreateInvoicePaymentResponse> => {
  const response = await api.post(`/invoices/${invoiceId}/payments/`, payload, {
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  return response.data;
};

/**
 * Path unverified on the rep prefix — mirrors the confirmed admin two-step
 * draft/issue contract at companies/return-invoices/.
 */
export const createReturnInvoice = async (
  payload: CreateReturnInvoicePayload,
): Promise<CreateReturnInvoiceResponse> => {
  const response = await api.post("/reps/return-invoices/", payload, {
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  return response.data;
};

export const issueReturnInvoice = async (
  returnInvoiceId: number,
  payload?: IssueReturnInvoicePayload,
): Promise<IssueReturnInvoiceResponse> => {
  const response = await api.post(
    `/reps/return-invoices/${returnInvoiceId}/issue/`,
    payload ?? {},
    { headers: { "Idempotency-Key": crypto.randomUUID() } },
  );
  return response.data;
};

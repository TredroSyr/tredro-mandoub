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
} from "../types";

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

/**
 * Path unverified on the rep prefix — mirrors the confirmed admin contract at
 * companies/sales-invoices/{id}/payments/ (see tredro-dashborad/module/invoices).
 */
export const createInvoicePayment = async (
  invoiceId: number,
  payload: CreateInvoicePaymentPayload,
): Promise<CreateInvoicePaymentResponse> => {
  const response = await api.post(`/reps/sales-invoices/${invoiceId}/payments/`, payload, {
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

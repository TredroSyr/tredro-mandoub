import api from "@/lib/axios";
import {
  CreatePaymentPayload,
  CreatePaymentResponse,
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

/**
 * Confirmed (frontend4.md §10).
 *
 * `idempotencyKey` defaults to a fresh UUID so existing callers are
 * unaffected, but a caller that expects the rep might retry this exact
 * submission (a resubmit after a timeout, or — once the offline outbox
 * exists — a queued item replayed on reconnect) must generate the key once,
 * up front, and pass the same value on every attempt. Generating it inside
 * this function would mint a new key per HTTP call, which defeats
 * idempotency on exactly the retries it exists to protect.
 */
export const createSalesInvoice = async (
  payload: CreateSalesInvoicePayload,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CreateSalesInvoiceResponse> => {
  const response = await api.post("/reps/sales-invoices/", payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
};

export const getSalesInvoiceDetail = async (
  invoiceId: number,
): Promise<SalesInvoiceDetailResponse> => {
  const response = await api.get(`/reps/sales-invoices/${invoiceId}/`);
  return response.data;
};

/** Confirmed contract: POST /reps/payments/. See createSalesInvoice re: idempotencyKey. */
export const createPayment = async (
  payload: CreatePaymentPayload,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CreatePaymentResponse> => {
  const response = await api.post("/reps/payments/", payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
};

/**
 * Path unverified on the rep prefix — mirrors the confirmed admin two-step
 * draft/issue contract at companies/return-invoices/. See createSalesInvoice
 * re: idempotencyKey.
 */
export const createReturnInvoice = async (
  payload: CreateReturnInvoicePayload,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CreateReturnInvoiceResponse> => {
  const response = await api.post("/reps/return-invoices/", payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
};

export const issueReturnInvoice = async (
  returnInvoiceId: number,
  payload?: IssueReturnInvoicePayload,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<IssueReturnInvoiceResponse> => {
  const response = await api.post(
    `/reps/return-invoices/${returnInvoiceId}/issue/`,
    payload ?? {},
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return response.data;
};

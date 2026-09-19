import api from "@/lib/axios";
import {
  CustomerRequestDetailResponse,
  CustomerRequestsListParams,
  CustomerRequestsResponse,
  RejectCustomerRequestPayload,
} from "../types";

export const getCustomerRequests = async (
  params?: CustomerRequestsListParams,
): Promise<CustomerRequestsResponse> => {
  const response = await api.get("/reps/customer-requests/", { params });
  return response.data;
};

export const getCustomerRequestById = async (
  requestId: number,
): Promise<CustomerRequestDetailResponse> => {
  const response = await api.get(`/reps/customer-requests/${requestId}/`);
  return response.data;
};

/**
 * `idempotencyKey` defaults to a fresh UUID so existing callers are
 * unaffected. The backend isn't confirmed to read this header on this route
 * yet (see the offline-mode report's open questions) — sending it now is
 * harmless and means no client change is needed once that's confirmed.
 */
export const acceptCustomerRequest = async (
  requestId: number,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CustomerRequestDetailResponse> => {
  const response = await api.post(
    `/reps/customer-requests/${requestId}/accept/`,
    {},
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return response.data;
};

export const rejectCustomerRequest = async (
  requestId: number,
  payload?: RejectCustomerRequestPayload,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CustomerRequestDetailResponse> => {
  const response = await api.post(
    `/reps/customer-requests/${requestId}/reject/`,
    payload ?? {},
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return response.data;
};

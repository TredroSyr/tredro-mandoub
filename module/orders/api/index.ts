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

export const acceptCustomerRequest = async (
  requestId: number,
): Promise<CustomerRequestDetailResponse> => {
  const response = await api.post(`/reps/customer-requests/${requestId}/accept/`);
  return response.data;
};

export const rejectCustomerRequest = async (
  requestId: number,
  payload?: RejectCustomerRequestPayload,
): Promise<CustomerRequestDetailResponse> => {
  const response = await api.post(`/reps/customer-requests/${requestId}/reject/`, payload ?? {});
  return response.data;
};

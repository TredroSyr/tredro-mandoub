import api from "@/lib/axios";
import {
  CustomersListResponse,
  CustomerDetailResponse,
  CustomerStatsResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
  UpdateRepWorkDaysRequest,
  UpdateRepWorkDaysResponse,
} from "../types";

export const getCustomers = async (params?: {
  is_active?: boolean;
  search?: string;
}): Promise<CustomersListResponse> => {
  const response = await api.get<CustomersListResponse>("/api/reps/customers/", {
    params,
  });
  return response.data;
};

export const getCustomerById = async (
  customerId: number,
): Promise<CustomerDetailResponse> => {
  const response = await api.get<CustomerDetailResponse>(
    `/api/reps/customers/${customerId}/`,
  );
  return response.data;
};

export const getCustomerStats = async (): Promise<CustomerStatsResponse> => {
  const response = await api.get<CustomerStatsResponse>(
    "/api/reps/customers/stats/",
  );
  return response.data;
};

export const updateCustomer = async (
  customerId: number,
  data: UpdateCustomerRequest,
): Promise<UpdateCustomerResponse> => {
  const response = await api.patch<UpdateCustomerResponse>(
    `/api/reps/customers/${customerId}/`,
    data,
  );
  return response.data;
};

export const updateRepWorkDays = async (
  data: UpdateRepWorkDaysRequest,
): Promise<UpdateRepWorkDaysResponse> => {
  const response = await api.patch<UpdateRepWorkDaysResponse>(
    "/api/reps/profile/",
    data,
  );
  return response.data;
};

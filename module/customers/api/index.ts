import api from "@/lib/axios";
import {
  CustomersListResponse,
  CustomerDetailResponse,
  CustomerStatsResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
  UpdateRepWorkDaysRequest,
  UpdateRepWorkDaysResponse,
  CreateCustomerRequest,
  CreateCustomerResponse,
} from "../types";

export const getCustomers = async (params?: {
  is_active?: boolean;
  search?: string;
}): Promise<CustomersListResponse> => {
  const response = await api.get<CustomersListResponse>("/reps/customers/", {
    params,
  });
  return response.data;
};

export const getCustomerById = async (
  customerId: number,
): Promise<CustomerDetailResponse> => {
  const response = await api.get<CustomerDetailResponse>(
    `/reps/customers/${customerId}/`,
  );
  return response.data;
};

export const getCustomerStats = async (): Promise<CustomerStatsResponse> => {
  const response = await api.get<CustomerStatsResponse>(
    "/reps/customers/stats/",
  );
  return response.data;
};

export const updateCustomer = async (
  customerId: number,
  data: UpdateCustomerRequest,
): Promise<UpdateCustomerResponse> => {
  const response = await api.patch<UpdateCustomerResponse>(
    `/reps/customers/${customerId}/`,
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

export const createCustomer = async (
  data: CreateCustomerRequest,
): Promise<CreateCustomerResponse> => {
  const response = await api.post<CreateCustomerResponse>(
    "/reps/customers/",
    data,
  );
  return response.data;
};

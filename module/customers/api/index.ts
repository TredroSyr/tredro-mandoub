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
  Customer,
} from "../types";

/**
 * Normalize customer data from API response:
 * - Converts latitude/longitude from string to number
 * - Handles cases where values are null
 */
function normalizeCustomer(customer: any): Customer {
  return {
    ...customer,
    latitude:
      customer.latitude === null
        ? null
        : typeof customer.latitude === "string"
          ? parseFloat(customer.latitude)
          : customer.latitude,
    longitude:
      customer.longitude === null
        ? null
        : typeof customer.longitude === "string"
          ? parseFloat(customer.longitude)
          : customer.longitude,
  };
}

export const getCustomers = async (params?: {
  is_active?: boolean;
  search?: string;
}): Promise<CustomersListResponse> => {
  const response = await api.get("/reps/customers/", {
    params,
  });
  const data = response.data;

  // Normalize the coordinate values
  return {
    ...data,
    data: {
      ...data.data,
      customers: (data.data?.customers ?? []).map(normalizeCustomer),
    },
  };
};

export const getCustomerById = async (
  customerId: number,
): Promise<CustomerDetailResponse> => {
  const response = await api.get(
    `/reps/customers/${customerId}/`,
  );
  const data = response.data;

  // Normalize the coordinate values
  return {
    ...data,
    data: {
      ...data.data,
      customer: normalizeCustomer(data.data?.customer),
    },
  };
};

export const getCustomerStats = async (): Promise<CustomerStatsResponse> => {
  const response = await api.get(
    "/reps/customers/stats/",
  );
  return response.data;
};

export const updateCustomer = async (
  customerId: number,
  data: UpdateCustomerRequest,
): Promise<UpdateCustomerResponse> => {
  const response = await api.patch(
    `/reps/customers/${customerId}/`,
    data,
  );
  const resData = response.data;

  // Normalize the coordinate values
  return {
    ...resData,
    data: {
      ...resData.data,
      customer: normalizeCustomer(resData.data?.customer),
    },
  };
};

export const updateRepWorkDays = async (
  data: UpdateRepWorkDaysRequest,
): Promise<UpdateRepWorkDaysResponse> => {
  const response = await api.patch(
    "/api/reps/profile/",
    data,
  );
  return response.data;
};

export const createCustomer = async (
  data: CreateCustomerRequest,
): Promise<CreateCustomerResponse> => {
  const response = await api.post(
    "/reps/customers/",
    data,
  );
  const resData = response.data;

  // Normalize the coordinate values
  return {
    ...resData,
    data: {
      ...resData.data,
      customer: normalizeCustomer(resData.data?.customer),
    },
  };
};

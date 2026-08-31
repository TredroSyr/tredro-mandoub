import api from "@/lib/axios";
import {
  Customer,
  CustomerDetailResponse,
  CustomerDocumentsParams,
  CustomerRequestsResponse,
  CustomersListResponse,
  CreateCustomerRequest,
  CreateCustomerResponse,
  PaymentsResponse,
  ReturnInvoicesResponse,
  SalesInvoicesResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
  UpdateRepWorkDaysRequest,
  UpdateRepWorkDaysResponse,
} from "../types";

/**
 * Normalize customer data from API response:
 * - Converts latitude/longitude from string to number
 * - Handles cases where values are null
 */
function normalizeCustomer(customer: Customer): Customer {
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
  work_day?: string;
}): Promise<CustomersListResponse> => {
  const response = await api.get("/reps/customers/", { params });
  const data = response.data;

  return {
    ...data,
    data: {
      ...data.data,
      customers: (data.data?.customers ?? []).map(normalizeCustomer),
    },
  };
};

export const getCustomerById = async (customerId: number): Promise<CustomerDetailResponse> => {
  const response = await api.get(`/reps/customers/${customerId}/`);
  const data = response.data;

  return {
    ...data,
    data: {
      ...data.data,
      customer: normalizeCustomer(data.data?.customer),
    },
  };
};

export const updateCustomer = async (
  customerId: number,
  data: UpdateCustomerRequest,
): Promise<UpdateCustomerResponse> => {
  const response = await api.patch(`/reps/customers/${customerId}/`, data);
  const resData = response.data;

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
  const response = await api.patch("/reps/profile/", data);
  return response.data;
};

export const createCustomer = async (
  data: CreateCustomerRequest,
): Promise<CreateCustomerResponse> => {
  const response = await api.post("/reps/customers/", data);
  const resData = response.data;

  return {
    ...resData,
    data: {
      ...resData.data,
      customer: normalizeCustomer(resData.data?.customer),
    },
  };
};

export const getCustomerRequests = async (
  customerId: number,
  params?: CustomerDocumentsParams & { status?: string },
): Promise<CustomerRequestsResponse> => {
  const response = await api.get("/reps/customer-requests/", {
    params: { customer: customerId, ...params },
  });
  return response.data;
};

export const getCustomerSalesInvoices = async (
  customerId: number,
  params?: CustomerDocumentsParams,
): Promise<SalesInvoicesResponse> => {
  const response = await api.get("/reps/sales-invoices/", {
    params: { customer: customerId, ...params },
  });
  return response.data;
};

export const getCustomerPayments = async (
  customerId: number,
  params?: CustomerDocumentsParams,
): Promise<PaymentsResponse> => {
  const response = await api.get("/reps/payments/", {
    params: { customer: customerId, ...params },
  });
  return response.data;
};

export const getCustomerReturnInvoices = async (
  customerId: number,
  params?: CustomerDocumentsParams,
): Promise<ReturnInvoicesResponse> => {
  const response = await api.get("/reps/return-invoices/", {
    params: { customer: customerId, ...params },
  });
  return response.data;
};

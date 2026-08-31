import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  createCustomer,
  getCustomerById,
  getCustomerPayments,
  getCustomerRequests,
  getCustomerReturnInvoices,
  getCustomers,
  getCustomerSalesInvoices,
  updateCustomer,
  updateRepWorkDays,
} from "../api";
import {
  CreateCustomerRequest,
  CustomerDocumentsParams,
  UpdateCustomerRequest,
  UpdateRepWorkDaysRequest,
} from "../types";

export const useGetCustomersQuery = (params?: {
  is_active?: boolean;
  search?: string;
  work_day?: string;
}) => {
  return useQuery({
    queryKey: ["customers", params?.is_active, params?.search, params?.work_day],
    queryFn: () => getCustomers(params),
  });
};

export const useGetCustomerByIdQuery = (customerId: number | null) => {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => {
      if (!customerId) throw new Error("Customer ID is required");
      return getCustomerById(customerId);
    },
    enabled: !!customerId,
  });
};

export const useUpdateCustomerMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateCustomer"],
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: number;
      data: UpdateCustomerRequest;
    }) => updateCustomer(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      toast.success("تم تحديث بيانات العميل بنجاح");
      if (options?.onSuccess) options.onSuccess();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "فشل تحديث بيانات العميل");
      if (options?.onError) options.onError(error);
    },
  });
};

export const useUpdateRepWorkDaysMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateRepWorkDays"],
    mutationFn: (data: UpdateRepWorkDaysRequest) => updateRepWorkDays(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repProfile"] });
      toast.success("تم تحديث أيام العمل بنجاح");
      if (options?.onSuccess) options.onSuccess();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "فشل تحديث أيام العمل");
      if (options?.onError) options.onError(error);
    },
  });
};

export const useCreateCustomerMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["createCustomer"],
    mutationFn: (data: CreateCustomerRequest) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("تم إضافة العميل بنجاح");
      if (options?.onSuccess) options.onSuccess();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "فشل إضافة العميل");
      if (options?.onError) options.onError(error);
    },
  });
};

/** الطلبات السابقة (customer-requests) لمحل معيّن */
export const useGetCustomerRequestsQuery = (
  customerId: number | null,
  params?: CustomerDocumentsParams & { status?: string },
) => {
  return useQuery({
    queryKey: ["customerRequests", customerId, params],
    queryFn: () => {
      if (!customerId) throw new Error("Customer ID is required");
      return getCustomerRequests(customerId, params);
    },
    enabled: !!customerId,
  });
};

/** فواتير المبيعات لمحل معيّن */
export const useGetCustomerSalesInvoicesQuery = (
  customerId: number | null,
  params?: CustomerDocumentsParams,
) => {
  return useQuery({
    queryKey: ["customerSalesInvoices", customerId, params],
    queryFn: () => {
      if (!customerId) throw new Error("Customer ID is required");
      return getCustomerSalesInvoices(customerId, params);
    },
    enabled: !!customerId,
  });
};

/** الدفعات المسجّلة لمحل معيّن */
export const useGetCustomerPaymentsQuery = (
  customerId: number | null,
  params?: CustomerDocumentsParams,
) => {
  return useQuery({
    queryKey: ["customerPayments", customerId, params],
    queryFn: () => {
      if (!customerId) throw new Error("Customer ID is required");
      return getCustomerPayments(customerId, params);
    },
    enabled: !!customerId,
  });
};

/** فواتير المرتجعات لمحل معيّن */
export const useGetCustomerReturnInvoicesQuery = (
  customerId: number | null,
  params?: CustomerDocumentsParams,
) => {
  return useQuery({
    queryKey: ["customerReturnInvoices", customerId, params],
    queryFn: () => {
      if (!customerId) throw new Error("Customer ID is required");
      return getCustomerReturnInvoices(customerId, params);
    },
    enabled: !!customerId,
  });
};

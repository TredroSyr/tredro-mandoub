import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  getCustomers,
  getCustomerById,
  getCustomerStats,
  updateCustomer,
  updateRepWorkDays,
} from "../api";
import {
  UpdateCustomerRequest,
  UpdateRepWorkDaysRequest,
} from "../types";

export const useGetCustomersQuery = (params?: {
  is_active?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["customers", params?.is_active, params?.search],
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

export const useGetCustomerStatsQuery = () => {
  return useQuery({
    queryKey: ["customerStats"],
    queryFn: getCustomerStats,
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

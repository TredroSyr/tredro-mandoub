import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  acceptCustomerRequest,
  getCustomerRequestById,
  getCustomerRequests,
  rejectCustomerRequest,
} from "../api";
import { CustomerRequestsListParams, RejectCustomerRequestPayload } from "../types";

export const useGetCustomerRequestsQuery = (params?: CustomerRequestsListParams) => {
  return useQuery({
    queryKey: ["customerRequests", params],
    queryFn: () => getCustomerRequests(params),
  });
};

export const useGetCustomerRequestByIdQuery = (requestId: number | null) => {
  return useQuery({
    queryKey: ["customerRequest", requestId],
    queryFn: () => {
      if (!requestId) throw new Error("Request ID is required");
      return getCustomerRequestById(requestId);
    },
    enabled: !!requestId,
  });
};

/** Both answer actions touch the same lists: this request's own cache, every requests list, and the dashboard's counts. */
function useInvalidateCustomerRequests() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["customerRequests"] });
    queryClient.invalidateQueries({ queryKey: ["customerRequest"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export const useAcceptCustomerRequestMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateCustomerRequests();

  return useMutation({
    mutationKey: ["acceptCustomerRequest"],
    mutationFn: (requestId: number) => acceptCustomerRequest(requestId),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message || "تم قبول الطلب");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "تعذّر قبول الطلب");
      options?.onError?.(error);
    },
  });
};

export const useRejectCustomerRequestMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateCustomerRequests();

  return useMutation({
    mutationKey: ["rejectCustomerRequest"],
    mutationFn: ({ requestId, payload }: { requestId: number; payload?: RejectCustomerRequestPayload }) =>
      rejectCustomerRequest(requestId, payload),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message || "تم رفض الطلب");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "تعذّر رفض الطلب");
      options?.onError?.(error);
    },
  });
};

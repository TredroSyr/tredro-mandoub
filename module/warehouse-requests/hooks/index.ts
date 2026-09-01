import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  confirmStockTransfer,
  createStockTransfer,
  getRepProducts,
  getStockTransfers,
  receiveStockTransfer,
  rejectStockTransfer,
} from "../api";
import {
  CreateStockTransferPayload,
  RepProductsListParams,
  StockTransfersListParams,
} from "../types";

export const useGetRepProductsQuery = (
  params?: RepProductsListParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["repProducts", params],
    queryFn: () => getRepProducts(params),
    enabled: options?.enabled ?? true,
  });
};

export const useGetStockTransfersQuery = (
  params?: StockTransfersListParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["stockTransfers", params],
    queryFn: () => getStockTransfers(params),
    enabled: options?.enabled ?? true,
  });
};

/** create/confirm/reject/receive all touch the transfer list and the product picker's van_quantity. */
function useInvalidateStockTransfers() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["stockTransfers"] });
    queryClient.invalidateQueries({ queryKey: ["repProducts"] });
  };
}

export const useCreateStockTransferMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateStockTransfers();

  return useMutation({
    mutationKey: ["createStockTransfer"],
    mutationFn: (payload: CreateStockTransferPayload) => createStockTransfer(payload),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message || "تم إرسال الطلب للشركة");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "تعذّر إرسال الطلب");
      options?.onError?.(error);
    },
  });
};

export const useConfirmStockTransferMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateStockTransfers();

  return useMutation({
    mutationKey: ["confirmStockTransfer"],
    mutationFn: (transferId: number) => confirmStockTransfer(transferId),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message || "تم قبول الكميات المعدّلة");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "تعذّر تأكيد الطلب");
      options?.onError?.(error);
    },
  });
};

export const useRejectStockTransferMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateStockTransfers();

  return useMutation({
    mutationKey: ["rejectStockTransfer"],
    mutationFn: (transferId: number) => rejectStockTransfer(transferId),
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

export const useReceiveStockTransferMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateStockTransfers();

  return useMutation({
    mutationKey: ["receiveStockTransfer"],
    mutationFn: (transferId: number) => receiveStockTransfer(transferId),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message || "تمت إضافة البضاعة لمستودع السيارة");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "تعذّر استلام البضاعة");
      options?.onError?.(error);
    },
  });
};

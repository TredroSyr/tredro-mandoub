import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { OfflineQueuedError, QUEUED_MESSAGE } from "@/lib/sync/errors";
import { runOrQueue } from "@/lib/sync/queue-on-offline";
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
  StockTransfer,
  StockTransferDetailResponse,
  StockTransfersListParams,
  StockTransfersResponse,
} from "../types";

type MutationError = AxiosError<ApiErrorResponse> | OfflineQueuedError;

/** Patches the freshly confirmed/rejected/received transfer into every cached list immediately, instead of waiting on the background refetch from invalidate(). */
function usePatchStockTransferCache() {
  const queryClient = useQueryClient();
  return (updated: StockTransfer) => {
    queryClient.setQueriesData<StockTransfersResponse>(
      { queryKey: ["stockTransfers"] },
      (old) =>
        old
          ? {
              ...old,
              data: {
                ...old.data,
                transfers: old.data.transfers.map((t) =>
                  t.id === updated.id ? updated : t,
                ),
              },
            }
          : old,
    );
  };
}

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
  onQueued?: () => void;
  /** Id of the outbox item being edited; removed once this resubmission is accepted or re-queued. */
  replacesOutboxId?: string;
}) => {
  const invalidate = useInvalidateStockTransfers();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<StockTransferDetailResponse, MutationError, CreateStockTransferPayload>({
    mutationKey: ["createStockTransfer"],
    mutationFn: (payload) => {
      const key = keyFor(payload);
      return runOrQueue({
        id: key,
        kind: "create_stock_transfer",
        label: `طلب بضاعة (${payload.lines.length} صنف)`,
        payload,
        run: () => createStockTransfer(payload, key),
        replaces: options?.replacesOutboxId,
      });
    },
    onSuccess: (data) => {
      reset();
      invalidate();
      toast.success(data.message || "تم إرسال الطلب للشركة");
      options?.onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onQueued?.();
        return;
      }
      if (error.response) reset();
      toast.error(error.response?.data?.message || "تعذّر إرسال الطلب");
      options?.onError?.(error);
    },
  });
};

export const useConfirmStockTransferMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  onQueued?: () => void;
}) => {
  const invalidate = useInvalidateStockTransfers();
  const patchCache = usePatchStockTransferCache();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<StockTransferDetailResponse, MutationError, number>({
    mutationKey: ["confirmStockTransfer"],
    // This endpoint takes no Idempotency-Key; the id only de-dupes a double
    // tap in the local outbox.
    mutationFn: (transferId) =>
      runOrQueue({
        id: keyFor({ kind: "confirm_stock_transfer", transferId }),
        kind: "confirm_stock_transfer",
        label: `قبول الكميات المعدّلة — طلب رقم ${transferId}`,
        payload: { transferId },
        run: () => confirmStockTransfer(transferId),
      }),
    onSuccess: (data) => {
      reset();
      if (data.data?.transfer) patchCache(data.data.transfer);
      invalidate();
      toast.success(data.message || "تم قبول الكميات المعدّلة");
      options?.onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onQueued?.();
        return;
      }
      if (error.response) reset();
      toast.error(error.response?.data?.message || "تعذّر تأكيد الطلب");
      options?.onError?.(error);
    },
  });
};

export const useRejectStockTransferMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  onQueued?: () => void;
}) => {
  const invalidate = useInvalidateStockTransfers();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<StockTransferDetailResponse, MutationError, number>({
    mutationKey: ["rejectStockTransfer"],
    mutationFn: (transferId) =>
      runOrQueue({
        id: keyFor({ kind: "reject_stock_transfer", transferId }),
        kind: "reject_stock_transfer",
        label: `رفض طلب البضاعة رقم ${transferId}`,
        payload: { transferId },
        run: () => rejectStockTransfer(transferId),
      }),
    onSuccess: (data) => {
      reset();
      invalidate();
      toast.success(data.message || "تم رفض الطلب");
      options?.onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onQueued?.();
        return;
      }
      if (error.response) reset();
      toast.error(error.response?.data?.message || "تعذّر رفض الطلب");
      options?.onError?.(error);
    },
  });
};

export const useReceiveStockTransferMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  onQueued?: () => void;
}) => {
  const invalidate = useInvalidateStockTransfers();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<StockTransferDetailResponse, MutationError, number>({
    mutationKey: ["receiveStockTransfer"],
    mutationFn: (transferId) => {
      const key = keyFor({ kind: "receive_stock_transfer", transferId });
      return runOrQueue({
        id: key,
        kind: "receive_stock_transfer",
        label: `استلام البضاعة — طلب رقم ${transferId}`,
        payload: { transferId },
        run: () => receiveStockTransfer(transferId, key),
      });
    },
    onSuccess: (data) => {
      reset();
      invalidate();
      toast.success(data.message || "تمت إضافة البضاعة لمستودع السيارة");
      options?.onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onQueued?.();
        return;
      }
      if (error.response) reset();
      toast.error(error.response?.data?.message || "تعذّر استلام البضاعة");
      options?.onError?.(error);
    },
  });
};

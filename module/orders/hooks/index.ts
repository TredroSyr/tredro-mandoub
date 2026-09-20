import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { OfflineQueuedError, QUEUED_MESSAGE } from "@/lib/sync/errors";
import { runOrQueue } from "@/lib/sync/queue-on-offline";
import {
  acceptCustomerRequest,
  getCustomerRequestById,
  getCustomerRequests,
  rejectCustomerRequest,
} from "../api";
import {
  CustomerRequestDetailResponse,
  CustomerRequestsListParams,
  RejectCustomerRequestPayload,
} from "../types";

type MutationError = AxiosError<ApiErrorResponse> | OfflineQueuedError;

export const useGetCustomerRequestsQuery = (
  params?: CustomerRequestsListParams,
  options?: { refetchOnMount?: boolean | "always" },
) => {
  return useQuery({
    queryKey: ["customerRequests", params],
    queryFn: () => getCustomerRequests(params),
    refetchOnMount: options?.refetchOnMount,
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
  onQueued?: () => void;
}) => {
  const invalidate = useInvalidateCustomerRequests();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<CustomerRequestDetailResponse, MutationError, number>({
    mutationKey: ["acceptCustomerRequest"],
    mutationFn: (requestId) => {
      const key = keyFor({ kind: "accept_customer_request", requestId });
      return runOrQueue({
        id: key,
        kind: "accept_customer_request",
        label: `قبول طلب العميل رقم ${requestId}`,
        payload: { requestId },
        run: () => acceptCustomerRequest(requestId, key),
      });
    },
    onSuccess: (data) => {
      reset();
      invalidate();
      toast.success(data.message || "تم قبول الطلب");
      options?.onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onQueued?.();
        return;
      }
      if (error.response) reset();
      toast.error(error.response?.data?.message || "تعذّر قبول الطلب");
      options?.onError?.(error);
    },
  });
};

export const useRejectCustomerRequestMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  onQueued?: () => void;
  /** Id of the outbox item being edited; removed once this resubmission is accepted or re-queued. */
  replacesOutboxId?: string;
}) => {
  const invalidate = useInvalidateCustomerRequests();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<
    CustomerRequestDetailResponse,
    MutationError,
    { requestId: number; payload?: RejectCustomerRequestPayload }
  >({
    mutationKey: ["rejectCustomerRequest"],
    mutationFn: (variables) => {
      const key = keyFor({ kind: "reject_customer_request", ...variables });
      return runOrQueue({
        id: key,
        kind: "reject_customer_request",
        label: `رفض طلب العميل رقم ${variables.requestId}`,
        payload: variables,
        run: () => rejectCustomerRequest(variables.requestId, variables.payload, key),
        replaces: options?.replacesOutboxId,
      });
    },
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

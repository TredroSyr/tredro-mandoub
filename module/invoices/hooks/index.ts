import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { OfflineQueuedError, QUEUED_MESSAGE } from "@/lib/sync/errors";
import { runOrQueue } from "@/lib/sync/queue-on-offline";
import {
  createPayment,
  createReturnInvoice,
  createSalesInvoice,
  getSalesInvoiceDetail,
  getSalesInvoices,
  issueReturnInvoice,
} from "../api";
import {
  CreatePaymentPayload,
  CreatePaymentResponse,
  CreateReturnInvoicePayload,
  CreateReturnInvoiceResponse,
  CreateSalesInvoiceResponse,
  CreateSalesInvoicePayload,
  IssueReturnInvoicePayload,
  IssueReturnInvoiceResponse,
  SalesInvoicesListParams,
} from "../types";
import { isRefundMethodRequiredError } from "../lib/utils";

type MutationError = AxiosError<ApiErrorResponse> | OfflineQueuedError;

export const useGetSalesInvoicesQuery = (params?: SalesInvoicesListParams) => {
  return useQuery({
    queryKey: ["salesInvoices", params],
    queryFn: () => getSalesInvoices(params),
  });
};

export const useGetSalesInvoiceDetailQuery = (
  invoiceId: number | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["salesInvoiceDetail", invoiceId],
    queryFn: () => {
      if (!invoiceId) throw new Error("Invoice ID is required");
      return getSalesInvoiceDetail(invoiceId);
    },
    enabled: (options?.enabled ?? true) && !!invoiceId,
  });
};

/** Every money-affecting mutation here touches the customer's ledger and the dashboard aggregate. */
function useInvalidateInvoiceRelated() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["customerSalesInvoices"] });
    queryClient.invalidateQueries({ queryKey: ["customerPayments"] });
    queryClient.invalidateQueries({ queryKey: ["customerReturnInvoices"] });
    queryClient.invalidateQueries({ queryKey: ["salesInvoiceDetail"] });
    queryClient.invalidateQueries({ queryKey: ["customer"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export const useCreateSalesInvoiceMutation = (options?: {
  onSuccess?: (invoice: Awaited<ReturnType<typeof createSalesInvoice>>["data"]["invoice"]) => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  /** The write was saved offline and will sync later — treat the form as submitted. */
  onQueued?: () => void;
  /** Id of the outbox item being edited; removed once this resubmission is accepted or re-queued. */
  replacesOutboxId?: string;
}) => {
  const invalidate = useInvalidateInvoiceRelated();
  const queryClient = useQueryClient();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<CreateSalesInvoiceResponse, MutationError, CreateSalesInvoicePayload>({
    mutationKey: ["createSalesInvoice"],
    mutationFn: (payload) => {
      const key = keyFor(payload);
      return runOrQueue({
        id: key,
        kind: "create_sales_invoice",
        label: `فاتورة مبيعات — عميل رقم ${payload.customer_id}`,
        payload,
        run: () => createSalesInvoice(payload, key),
        replaces: options?.replacesOutboxId,
      });
    },
    onSuccess: (data, variables) => {
      reset();
      invalidate();
      if (variables.fulfils_request_ids?.length) {
        queryClient.invalidateQueries({ queryKey: ["customerRequests"] });
        queryClient.invalidateQueries({ queryKey: ["customerRequest"] });
      }
      toast.success(data.message || "تم إنشاء الفاتورة");
      options?.onSuccess?.(data.data.invoice);
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onQueued?.();
        return;
      }
      // The server answered and rejected it — the operation did not happen,
      // so the next attempt must not replay this key.
      if (error.response) reset();
      toast.error(error.response?.data?.message || "تعذّر إنشاء الفاتورة");
      options?.onError?.(error);
    },
  });
};

export const useCreatePaymentMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  onQueued?: () => void;
  /** Id of the outbox item being edited; removed once this resubmission is accepted or re-queued. */
  replacesOutboxId?: string;
}) => {
  const invalidate = useInvalidateInvoiceRelated();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<CreatePaymentResponse, MutationError, CreatePaymentPayload>({
    mutationKey: ["createPayment"],
    mutationFn: (payload) => {
      const key = keyFor(payload);
      return runOrQueue({
        id: key,
        kind: "create_payment",
        label: `دفعة بقيمة ${payload.amount} — فاتورة رقم ${payload.sales_invoice}`,
        payload,
        run: () => createPayment(payload, key),
        replaces: options?.replacesOutboxId,
      });
    },
    onSuccess: (data) => {
      reset();
      invalidate();
      toast.success(data.message || "تم تسجيل الدفعة");
      options?.onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onQueued?.();
        return;
      }
      if (error.response) reset();
      toast.error(error.response?.data?.message || "تعذّر تسجيل الدفعة");
      options?.onError?.(error);
    },
  });
};

export const useCreateReturnInvoiceMutation = (options?: {
  onSuccess?: (returnInvoice: Awaited<ReturnType<typeof createReturnInvoice>>["data"]["return_invoice"]) => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateInvoiceRelated();
  const { keyFor, reset } = useIdempotencyKey();

  // Deliberately NOT queued offline: a return is a two-step flow (create the
  // draft, then issue it by the id the server returns). Saving only the first
  // step would leave an un-issued draft on the server with nobody noticing.
  return useMutation<CreateReturnInvoiceResponse, MutationError, CreateReturnInvoicePayload>({
    mutationKey: ["createReturnInvoice"],
    mutationFn: (payload) => createReturnInvoice(payload, keyFor(payload)),
    onSuccess: (data) => {
      reset();
      invalidate();
      options?.onSuccess?.(data.data.return_invoice);
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) return;
      if (error.response) reset();
      toast.error(
        error.response
          ? error.response.data?.message || "تعذّر إنشاء المرتجع"
          : "المرتجع يحتاج اتصالاً بالإنترنت — حاول عند عودة الاتصال",
      );
      options?.onError?.(error);
    },
  });
};

export const useIssueReturnInvoiceMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  onQueued?: () => void;
  /** Id of the outbox item being edited; removed once this resubmission is accepted or re-queued. */
  replacesOutboxId?: string;
}) => {
  const invalidate = useInvalidateInvoiceRelated();
  const { keyFor, reset } = useIdempotencyKey();

  return useMutation<
    IssueReturnInvoiceResponse,
    MutationError,
    { id: number; payload?: IssueReturnInvoicePayload }
  >({
    mutationKey: ["issueReturnInvoice"],
    mutationFn: (variables) => {
      const key = keyFor(variables);
      return runOrQueue({
        id: key,
        kind: "issue_return_invoice",
        label: `ترحيل المرتجع رقم ${variables.id}`,
        payload: variables,
        run: () => issueReturnInvoice(variables.id, variables.payload, key),
        replaces: options?.replacesOutboxId,
      });
    },
    onSuccess: (data) => {
      reset();
      invalidate();
      toast.success(data.message || "تم ترحيل المرتجع");
      options?.onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof OfflineQueuedError) {
        toast.success(QUEUED_MESSAGE);
        options?.onQueued?.();
        return;
      }
      if (error.response) reset();
      // A refund-method-required response is an expected branch of the flow, not a failure — no toast.
      if (!isRefundMethodRequiredError(error)) {
        toast.error(error.response?.data?.message || "تعذّر ترحيل المرتجع");
      }
      options?.onError?.(error);
    },
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import { enqueueOutboxItem } from "@/lib/db/outbox";
import { OfflineQueuedError } from "@/lib/sync/errors";
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
  CreateReturnInvoicePayload,
  CreateSalesInvoiceResponse,
  CreateSalesInvoicePayload,
  IssueReturnInvoicePayload,
  SalesInvoicesListParams,
} from "../types";
import { isRefundMethodRequiredError } from "../lib/utils";

/** True only for a transport-level failure (no server response at all) — a real 4xx/5xx rejection still surfaces as a normal error. */
function isOfflineFailure(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

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
}) => {
  const invalidate = useInvalidateInvoiceRelated();
  const queryClient = useQueryClient();
  // Generated once per hook instance (i.e. once per screen), not per attempt,
  // so a rep resubmitting after a timeout replays the same key instead of
  // risking a duplicate invoice. Will be superseded by the outbox item's own
  // persisted key once offline queuing lands.
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  return useMutation<
    CreateSalesInvoiceResponse,
    AxiosError<ApiErrorResponse> | OfflineQueuedError,
    CreateSalesInvoicePayload
  >({
    mutationKey: ["createSalesInvoice"],
    mutationFn: async (payload: CreateSalesInvoicePayload) => {
      try {
        return await createSalesInvoice(payload, idempotencyKeyRef.current);
      } catch (error) {
        if (isOfflineFailure(error)) {
          // No connection at all — queue it instead of losing it. Replayed
          // later with this same key by lib/sync/flush-outbox.ts.
          await enqueueOutboxItem({
            id: idempotencyKeyRef.current,
            kind: "create_sales_invoice",
            label: `فاتورة مبيعات — عميل رقم ${payload.customer_id}`,
            payload,
          });
          throw new OfflineQueuedError();
        }
        throw error;
      }
    },
    onSuccess: (data, variables) => {
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
        // Not a failure from the rep's point of view — their invoice is
        // safely captured and will go out the moment connectivity returns.
        toast.success("لا يوجد اتصال — تم حفظ الفاتورة وستُرسل تلقائيًا عند عودة الاتصال");
        return;
      }
      toast.error(error.response?.data?.message || "تعذّر إنشاء الفاتورة");
      options?.onError?.(error);
    },
  });
};

export const useCreatePaymentMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateInvoiceRelated();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  return useMutation({
    mutationKey: ["createPayment"],
    mutationFn: (payload: CreatePaymentPayload) =>
      createPayment(payload, idempotencyKeyRef.current),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message || "تم تسجيل الدفعة");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
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
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  return useMutation({
    mutationKey: ["createReturnInvoice"],
    mutationFn: (payload: CreateReturnInvoicePayload) =>
      createReturnInvoice(payload, idempotencyKeyRef.current),
    onSuccess: (data) => {
      invalidate();
      options?.onSuccess?.(data.data.return_invoice);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "تعذّر إنشاء المرتجع");
      options?.onError?.(error);
    },
  });
};

export const useIssueReturnInvoiceMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateInvoiceRelated();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  return useMutation({
    mutationKey: ["issueReturnInvoice"],
    mutationFn: ({ id, payload }: { id: number; payload?: IssueReturnInvoicePayload }) =>
      issueReturnInvoice(id, payload, idempotencyKeyRef.current),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message || "تم ترحيل المرتجع");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      // A refund-method-required response is an expected branch of the flow, not a failure — no toast.
      if (!isRefundMethodRequiredError(error)) {
        toast.error(error.response?.data?.message || "تعذّر ترحيل المرتجع");
      }
      options?.onError?.(error);
    },
  });
};

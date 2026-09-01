import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  createInvoicePayment,
  createReturnInvoice,
  createSalesInvoice,
  getSalesInvoiceDetail,
  getSalesInvoices,
  issueReturnInvoice,
} from "../api";
import {
  CreateInvoicePaymentPayload,
  CreateReturnInvoicePayload,
  CreateSalesInvoicePayload,
  IssueReturnInvoicePayload,
  SalesInvoicesListParams,
} from "../types";
import { isRefundMethodRequiredError } from "../lib/utils";

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

  return useMutation({
    mutationKey: ["createSalesInvoice"],
    mutationFn: (payload: CreateSalesInvoicePayload) => createSalesInvoice(payload),
    onSuccess: (data, variables) => {
      invalidate();
      if (variables.fulfils_request_ids?.length) {
        queryClient.invalidateQueries({ queryKey: ["customerRequests"] });
        queryClient.invalidateQueries({ queryKey: ["customerRequest"] });
      }
      toast.success(data.message || "تم إنشاء الفاتورة");
      options?.onSuccess?.(data.data.invoice);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "تعذّر إنشاء الفاتورة");
      options?.onError?.(error);
    },
  });
};

export const useCreateInvoicePaymentMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const invalidate = useInvalidateInvoiceRelated();

  return useMutation({
    mutationKey: ["createInvoicePayment"],
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: number;
      payload: CreateInvoicePaymentPayload;
    }) => createInvoicePayment(invoiceId, payload),
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

  return useMutation({
    mutationKey: ["createReturnInvoice"],
    mutationFn: (payload: CreateReturnInvoicePayload) => createReturnInvoice(payload),
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

  return useMutation({
    mutationKey: ["issueReturnInvoice"],
    mutationFn: ({ id, payload }: { id: number; payload?: IssueReturnInvoicePayload }) =>
      issueReturnInvoice(id, payload),
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

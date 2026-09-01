export interface RepAssignment {
  id: number;
  name: string;
  phone: string;
  company_id: number;
  referral_code: string;
  work_days: string[];
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  category_details: unknown | null;
  assigned_reps_count: number;
  assigned_reps_details: RepAssignment[];
  referral_code_used: string | null;
  /** Free text: street, neighbourhood, city. "" when unset, never null. */
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Days *this* rep visits *this* store — the shortcut for the asking rep's own row. */
  work_days: string[];
  invoice_count: number;
  /** Fixed-precision money strings, e.g. "100.00" — never a JSON number. */
  total_invoiced: string;
  paid_amount: string;
  returned_amount: string;
  balance_due: string;
}

export interface Pagination {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomersListResponse {
  success: boolean;
  message: string;
  data: {
    customers: Customer[];
    total: number;
  };
}

export interface CustomerDetailResponse {
  success: boolean;
  message: string;
  data: {
    customer: Customer;
  };
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  work_days?: string[];
}

export interface CreateCustomerResponse {
  success: boolean;
  message: string;
  data: {
    customer: Customer;
  };
}

export interface UpdateCustomerRequest {
  address?: string;
  latitude?: number;
  longitude?: number;
  work_days?: string[];
}

export interface UpdateCustomerResponse {
  success: boolean;
  message: string;
  data: {
    customer: Customer;
  };
}

export interface UpdateRepWorkDaysRequest {
  work_days: string[];
}

export interface UpdateRepWorkDaysResponse {
  success: boolean;
  message: string;
  data: {
    profile: {
      id: number;
      name: string;
      work_days: string[];
    };
  };
}

/** Shared date-range params accepted by the four per-customer document lists. */
export interface CustomerDocumentsParams {
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export type {
  CustomerRequest,
  CustomerRequestLine,
  CustomerRequestsResponse,
  CustomerRequestStatus,
} from "@/module/orders/types";

export type SalesInvoiceStatus = "fully_paid" | "partially_paid" | "deferred" | string;

export interface SalesInvoice {
  id: number;
  number: string;
  date: string;
  rep: number;
  rep_name: string;
  customer: number;
  customer_name: string;
  customer_phone: string;
  warehouse: number;
  company_name: string;
  tax_registration_no: string;
  currency: string;
  total_amount: string;
  paid_amount: string;
  returned_amount: string;
  balance_due: string;
  overage_amount: string;
  status: SalesInvoiceStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SalesInvoicesResponse {
  success: boolean;
  message: string;
  data: {
    invoices: SalesInvoice[];
    pagination: Pagination;
  };
}

/** Shape confirmed against the live `/reps/payments/` response — not the guessed contract this used to carry. */
export interface Payment {
  id: number;
  sales_invoice: number;
  sales_invoice_number: string;
  amount: string;
  collected_by: number | null;
  collected_by_name: string | null;
  collected_at: string;
  source: string;
  applied_credit: number | null;
  note: string;
  created_at: string;
}

export interface PaymentsResponse {
  success: boolean;
  message: string;
  data: {
    payments: Payment[];
    total_amount: string;
    pagination: Pagination;
  };
}

export interface ReturnInvoice {
  id: number;
  number: string;
  date: string;
  sales_invoice: number;
  sales_invoice_number: string;
  rep: number;
  rep_name: string;
  warehouse: number;
  warehouse_name: string;
  company_name: string;
  tax_registration_no: string;
  currency: string;
  status: string;
  amount: string;
  overage_amount: string;
  refund_method: string;
  notes: string;
  issued_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnInvoicesResponse {
  success: boolean;
  message: string;
  data: {
    return_invoices: ReturnInvoice[];
    total_amount: string;
    pagination: Pagination;
  };
}

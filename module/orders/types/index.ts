/**
 * A customer request is a wishlist signal, not an order — nothing is reserved
 * and no debt exists until a Sales Invoice fulfils it. See §12 of the API docs.
 */
export type CustomerRequestStatus = "pending" | "accepted" | "fulfilled" | "rejected" | "cancelled";

export interface CustomerRequestLine {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  unit: number;
  unit_name: string;
  desired_quantity: string;
  /** Resolved from the catalog on read, never stored. null means "not priced", not free. */
  unit_price: string | null;
  line_total: string | null;
}

export interface CustomerRequest {
  id: number;
  company: number;
  customer: number;
  customer_name: string;
  customer_phone: string;
  rep: number;
  rep_name: string;
  status: CustomerRequestStatus;
  fulfilled_by_invoice: number | null;
  fulfilled_by_invoice_number: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string;
  line_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
  lines: CustomerRequestLine[];
  /** null when nothing on the request could be priced — render "no price", never 0. */
  estimated_total: string | null;
}

export interface Pagination {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerRequestsListParams {
  status?: CustomerRequestStatus;
  customer?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface CustomerRequestsResponse {
  success: boolean;
  message: string;
  data: {
    requests: CustomerRequest[];
    pagination: Pagination;
  };
}

export interface CustomerRequestDetailResponse {
  success: boolean;
  message: string;
  data: {
    request: CustomerRequest;
  };
}

export interface RejectCustomerRequestPayload {
  reason?: string;
}

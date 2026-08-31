export type StockTransferStatus =
  | "pending"
  | "modified_by_admin"
  | "pending_rep_confirmation"
  | "confirmed"
  | "received"
  | "cancelled";

export interface RepProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: number | null;
  unit: number;
  unit_name: string;
  unit_code: string;
  /** General shelf price. null means "not priced", never free. */
  price: string | null;
  /** Always a number string; "0.000" means the rep carries none. */
  van_quantity: string;
  image: string | null;
}

export interface Pagination {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RepProductsListParams {
  search?: string;
  category?: number;
  page?: number;
  page_size?: number;
}

export interface RepProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: RepProduct[];
    currency: string;
    pagination: Pagination;
  };
}

export interface StockTransferLine {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  unit: number;
  unit_name: string;
  requested_qty: string;
  /** null until an admin acts on the transfer — do not render as 0. */
  approved_qty: string | null;
  /** The quantity that will actually move. Always render this, not requested_qty. */
  effective_qty: string;
  unit_price: string | null;
  line_total: string | null;
}

export interface StockTransfer {
  id: number;
  number: string;
  rep: number;
  rep_name: string;
  source_warehouse: number;
  source_warehouse_name: string;
  destination_warehouse: number;
  destination_warehouse_name: string;
  status: StockTransferStatus;
  requested_at: string;
  /** A promise, not a timer — null when the transfer originated from the office. */
  pickup_within_hours: number | null;
  pickup_deadline: string | null;
  approved_at: string | null;
  received_at: string | null;
  cancelled_at: string | null;
  line_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
  lines: StockTransferLine[];
  /** Resolved from the catalog on read, never stored. Can be partial or null. */
  estimated_total: string | null;
}

export interface StockTransfersListParams {
  status?: StockTransferStatus;
  date?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface StockTransfersResponse {
  success: boolean;
  message: string;
  data: {
    transfers: StockTransfer[];
    pagination: Pagination;
  };
}

export interface StockTransferDetailResponse {
  success: boolean;
  message: string;
  data: {
    transfer: StockTransfer;
  };
}

export interface CreateStockTransferLine {
  product_id: number;
  quantity: string;
}

export interface CreateStockTransferPayload {
  lines: CreateStockTransferLine[];
  pickup_within_hours?: number;
  source_warehouse?: number;
  destination_warehouse?: number;
  notes?: string;
}

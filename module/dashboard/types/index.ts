import { ReturnInvoice, SalesInvoice } from "@/module/customers/types";

export interface DashboardParams {
  /** Day-picker shorthand — expands to that whole day server-side. Wins over date_from/date_to when both are sent. */
  date?: string;
  date_from?: string;
  date_to?: string;
  /** Rows returned inline per section. Default 10, max 50. */
  limit?: number;
}

export interface DashboardRep {
  id: number;
  name: string;
  phone: string;
  work_days: string[];
  company: { id: number; name: string };
}

export interface DashboardPeriod {
  date_from: string | null;
  date_to: string | null;
}

export interface DashboardCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface DashboardSales {
  invoice_count: number;
  total_amount: string;
  paid_amount: string;
  balance_due: string;
  invoices: SalesInvoice[];
}

export interface DashboardReturns {
  count: number;
  total_amount: string;
  draft_count: number;
  return_invoices: ReturnInvoice[];
}

/** Always all-time — never scoped to the date picker. */
export interface DashboardReceivables {
  invoice_count: number;
  total_balance_due: string;
  overdue_invoice_count: number;
  overdue_balance_due: string;
}

export interface WarehouseItemImage {
  id: number;
  image: string;
  alt_text: string;
}

export interface DashboardWarehouseItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_barcode: string;
  unit: number;
  unit_name: string;
  unit_code: string;
  quantity: string;
  /** null when the catalog has no general price for this product in the company's currency. */
  unit_price: string | null;
  /** Tri-state: true/false against the reorder point, null when untracked. */
  is_low_stock: boolean | null;
  image: WarehouseItemImage | null;
  updated_at: string;
}

/** null when the rep has no active van. */
export interface DashboardWarehouse {
  id: number;
  name: string;
  total_quantity: string;
  product_count: number;
  items: DashboardWarehouseItem[];
}

export interface DashboardNotifications {
  unread_count: number;
}

export interface DashboardData {
  rep: DashboardRep;
  period: DashboardPeriod;
  currency: DashboardCurrency;
  sales: DashboardSales;
  returns: DashboardReturns;
  receivables: DashboardReceivables;
  warehouse: DashboardWarehouse | null;
  notifications: DashboardNotifications;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

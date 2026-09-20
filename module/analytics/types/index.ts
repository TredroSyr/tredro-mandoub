export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Every "figure with a trend arrow". `change_pct` is null whenever `previous` is zero/absent. */
export interface OverviewCard<T = string> {
  value: T;
  previous: T;
  change_pct: number | null;
}

export interface OverviewPeriod {
  date_from: string;
  date_to: string;
  previous_date_from: string;
  previous_date_to: string;
}

export interface OverviewCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface OverviewFx {
  target: string;
  as_of: string | null;
  stale: boolean;
  rates: Record<string, string>;
}

/** A status breakdown always lists every status, including zeros — use `status` as the key, `label` as an English fallback. */
export interface OverviewStatusCount {
  status: string;
  label: string;
  count: number;
}

/** The logged-in rep's own overview (`GET /reps/overview/`). */
export interface RepOverview {
  rep: { id: number; name: string; phone: string; is_active: boolean; work_days: string[] };
  company: { id: number; name: string };
  period: OverviewPeriod;
  currency: OverviewCurrency;
  fx: OverviewFx;
  sales: {
    invoice_count: OverviewCard<number>;
    total_amount: OverviewCard<string>;
    paid_amount: OverviewCard<string>;
    balance_due: OverviewCard<string>;
  };
  /** Runs on a trailing-7-day clock (`visits.window`), not the date picker. */
  visits: {
    window: OverviewPeriod;
    count: OverviewCard<number>;
    last_visit_at: string | null;
    days_since_last_visit: number | null;
    visited_customer_count: number;
    unvisited_customer_count: number;
  };
  customer_requests: {
    count: OverviewCard<number>;
    pending_count: number;
    awaiting_delivery_count: number;
    by_status: OverviewStatusCount[];
  };
  customers: {
    assigned: OverviewCard<number>;
    new_via_referral: OverviewCard<number>;
  };
  stock_transfers: { pending_approval_count: number };
}

/** Same filter params feed the overview and its insights, so the cards and the AI sentence describe the same period. */
export interface OverviewParams {
  date_from?: string;
  date_to?: string;
  currency?: string;
}

export type RepOverviewResponse = ApiEnvelope<{ overview: RepOverview }>;

export type InsightSeverity = "warning" | "positive" | "neutral";

export interface Insight {
  /** Closed set today, but the server may add more — map unknown kinds to a generic icon. */
  kind: string;
  severity: InsightSeverity;
  /** Plain text, ≤ 60 chars. */
  title: string;
  /** Plain text, ≤ 180 chars. */
  body: string;
  facts: Record<string, unknown>;
  source: "rules" | "model";
}

export interface InsightsData {
  generated_at: string;
  model: string | null;
  /** 0–3 items, already in display order. Empty is a normal answer. */
  insights: Insight[];
}

export type InsightsResponse = ApiEnvelope<InsightsData>;

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

export type CurrenciesResponse = ApiEnvelope<{ currencies: Currency[] }>;

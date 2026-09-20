"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/tredro/error-state";
import { formatDateShort, formatMoneyParts } from "@/lib/format";
import { REQUEST_STATUS_META } from "@/module/orders/lib/utils";
import type { CustomerRequestStatus } from "@/module/orders/types";
import { useMyInsightsQuery, useMyOverviewQuery } from "../hooks";
import type { Insight, InsightSeverity, OverviewParams, RepOverview } from "../types";

/* ============================================================
   بيانات حقيقية من /reps/overview/
   ============================================================ */

interface Kpi {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  change: number | null;
  icon: iconName;
}

function buildKpis(overview: RepOverview): Kpi[] {
  const { sales, visits, customer_requests, customers, currency } = overview;
  const totalAmount = formatMoneyParts(sales.total_amount.value, currency.code);

  return [
    { key: "customers", label: "الزبائن المسندين", value: customers.assigned.value, change: customers.assigned.change_pct, icon: "users_outlined" },
    { key: "orders", label: "الطلبيات", value: customer_requests.count.value, change: customer_requests.count.change_pct, icon: "cart_outlined" },
    { key: "revenue", label: "قيمة المبيعات", value: totalAmount.amount, suffix: totalAmount.label, change: sales.total_amount.change_pct, icon: "revenue_outlined" },
    { key: "newCustomers", label: "زبائن جدد (إحالة)", value: customers.new_via_referral.value, change: customers.new_via_referral.change_pct, icon: "add_user_outlined" },
    // a queue — waiting on the rep to deliver, doesn't follow the date picker.
    { key: "pending", label: "بانتظار التسليم", value: customer_requests.awaiting_delivery_count, change: null, icon: "clock_outlined" },
    { key: "visits", label: "الزيارات (آخر 7 أيام)", value: visits.count.value, change: visits.count.change_pct, icon: "map_outlined" },
  ];
}

interface DistributionBar {
  key: string;
  label: string;
  value: number;
}

function buildRequestBars(overview: RepOverview): { bars: DistributionBar[]; total: number } {
  const bars = overview.customer_requests.by_status.map((s) => ({
    key: s.status,
    label: REQUEST_STATUS_META[s.status as CustomerRequestStatus]?.label ?? s.label,
    value: s.count,
  }));
  return { bars, total: bars.reduce((sum, b) => sum + b.value, 0) };
}

interface ActivityTileData {
  value: string | number;
  suffix?: string;
  change: number | null;
  label: string;
  sub?: string;
}

interface ActivityGroupData {
  key: string;
  title: string;
  icon: iconName;
  tiles: ActivityTileData[];
}

function buildActivityGroups(overview: RepOverview): ActivityGroupData[] {
  const { sales, visits, customer_requests, customers, currency, period } = overview;
  const periodLabel = `${formatDateShort(period.date_from)} - ${formatDateShort(period.date_to)}`;
  const visitsWindowLabel = `${formatDateShort(visits.window.date_from)} - ${formatDateShort(visits.window.date_to)}`;
  const totalAmount = formatMoneyParts(sales.total_amount.value, currency.code);

  return [
    {
      key: "orders",
      title: "الطلبيات",
      icon: "cart_outlined",
      tiles: [
        { value: totalAmount.amount, suffix: totalAmount.label, change: sales.total_amount.change_pct, label: "إجمالي المبيعات", sub: periodLabel },
        { value: customer_requests.count.value, change: customer_requests.count.change_pct, label: "عدد الطلبيات", sub: periodLabel },
        { value: customer_requests.pending_count, change: null, label: "طلبيات معلّقة", sub: "بانتظار ردّك" },
      ],
    },
    {
      key: "visits",
      title: "الزيارات",
      icon: "map_outlined",
      tiles: [
        { value: visits.count.value, change: visits.count.change_pct, label: "الزيارات", sub: visitsWindowLabel },
        { value: visits.unvisited_customer_count, change: null, label: "محلات غير مزارة", sub: "خلال هذا الأسبوع" },
        {
          value: visits.days_since_last_visit ?? "—",
          change: null,
          label: "أيام منذ آخر زيارة",
          sub: visits.last_visit_at ? "آخر نشاط مسجَّل" : "لم تتم أي زيارة بعد",
        },
      ],
    },
    {
      key: "customers",
      title: "الزبائن",
      icon: "users_outlined",
      tiles: [
        { value: customers.assigned.value, change: customers.assigned.change_pct, label: "إجمالي الزبائن", sub: "مسندين للمندوب" },
        { value: customers.new_via_referral.value, change: customers.new_via_referral.change_pct, label: "زبائن جدد", sub: "عبر كود الإحالة" },
      ],
    },
  ];
}

/** The builders read these sections unguarded, so a response of another shape is treated as an error instead of crashing render. */
function hasOverviewShape(value: unknown): value is RepOverview {
  if (!value || typeof value !== "object") return false;
  const o = value as Partial<RepOverview>;
  return Boolean(o.currency && o.period && o.sales && o.visits && o.customer_requests && o.customers);
}

const ACTIVITY_SKELETON_GROUP_SIZES = [3, 3, 2];

// The client owns the icon — the server only sends `kind`.
const KIND_ICON: Record<string, iconName> = {
  orders_forecast: "cart_outlined",
  sales_forecast: "revenue_outlined",
  collection_rate: "transaction_outlined",
  overdue_pressure: "clock_outlined",
  returns_rate: "undo_outlined",
  coverage: "location_outlined",
  request_backlog: "report_outlined",
  top_performer: "star_outlined",
  customer_activity: "users_outlined",
  customer_dormant: "time_outlined",
};
const GENERIC_ICON: iconName = "info_outlined";

const SEVERITY_ICON_CLASS: Record<InsightSeverity, string> = {
  warning: "text-amber-200",
  positive: "text-emerald-200",
  neutral: "text-white/80",
};

/* ============================================================
   Drag scroll (سحب أفقي بالماوس/اللمس ضمن نفس الملف)
   ============================================================ */

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const state = useRef({ startX: 0, startLeft: 0 });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    setDragging(true);
    state.current.startX = e.clientX;
    state.current.startLeft = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = state.current.startLeft - (e.clientX - state.current.startX);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    ref.current?.releasePointerCapture(e.pointerId);
  };

  return { ref, dragging, onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag };
}

/* ============================================================
   KPI Row — يبقى تمرير أفقي دائمًا لأن حاوية التطبيق ضيقة (max-w-md)
   ============================================================ */

function KpiCardSkeleton() {
  return (
    <div className="flex w-[150px] shrink-0 flex-col gap-2.5 rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-3 w-8" />
      </div>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function KpiCard({ item }: { item: Kpi }) {
  const change = item.change;
  const isUp = (change ?? 0) >= 0;
  return (
    <div className="flex w-[150px] shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconRenderer name={item.icon} className="size-4" />
        </div>
        {change != null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}>
            <IconRenderer name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"} className="size-3" />
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-1">
        <span className="truncate text-xl font-semibold text-foreground">{item.value}</span>
        {item.suffix && <span className="text-xs text-muted-foreground">{item.suffix}</span>}
      </div>
      <span className="truncate text-xs text-muted-foreground">{item.label}</span>
    </div>
  );
}

function KpiRow({ kpis }: { kpis: Kpi[] | null }) {
  const { ref, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useDragScroll();

  if (!kpis) {
    return (
      <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden ${
        dragging ? "cursor-grabbing select-none" : "cursor-grab"
      }`}
    >
      {kpis.map(({ key, ...item }) => (
        <KpiCard key={key} item={{ key, ...item }} />
      ))}
    </div>
  );
}

/* ============================================================
   توزيع الطلبيات
   ============================================================ */

function OrdersDistributionSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-16" />
      <div className="mt-6 flex flex-1 items-end gap-2">
        {[60, 90, 40, 70].map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end">
              <Skeleton className="w-full" style={{ height: `${h}%` } as React.CSSProperties} />
            </div>
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersDistributionCard({ bars, total }: { bars: DistributionBar[]; total: number }) {
  const [sel, setSel] = useState(0);
  const maxV = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">توزيع الطلبيات</span>
        <IconRenderer name="arrow_up_right_outlined" className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">طلبية</span>
      </div>

      <div className="mt-6 flex flex-1 items-end gap-2">
        {bars.map((d, i) => {
          const isSel = sel === i;
          const h = (d.value / maxV) * 100;
          return (
            <button key={d.key} onClick={() => setSel(i)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end">
                <div className={`w-full rounded-md transition-all ${isSel ? "bg-primary" : "bg-primary/15"}`} style={{ height: `${h}%` }}>
                  {isSel && (
                    <div className="w-full pt-1 text-center">
                      <span className="text-[11px] font-semibold text-primary-foreground">{d.value}</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="w-full truncate text-center text-[11px] text-muted-foreground">{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   بانر التوقعات (rotating) — نصوص من /reps/overview/insights/
   ============================================================ */

function InsightBannerSkeleton() {
  return (
    <div className="flex h-full min-h-[200px] flex-col justify-between rounded-2xl bg-primary p-4">
      <Skeleton className="h-5 w-28 bg-white/20" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-36 bg-white/20" />
        <Skeleton className="h-3 w-full bg-white/20" />
        <Skeleton className="h-3 w-3/4 bg-white/20" />
      </div>
    </div>
  );
}

const ROTATE_MS = 5000;

function InsightBanner({ insights }: { insights: Insight[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (insights.length < 2) return;
    const id = setInterval(() => setActive((p) => (p + 1) % insights.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [insights.length]);

  // The list can shrink between refetches (e.g. a new date range) while `active` still points past its end.
  const index = active % insights.length;
  const current = insights[index];
  // The badge is only honest when a model actually wrote some of the wording.
  const aiWritten = insights.some((i) => i.source === "model");

  return (
    <div className="relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium">توقعات وتنبؤات</span>
        {aiWritten && (
          <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium">
            <IconRenderer name="ai_outlined" className="size-3" />
            AI
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <IconRenderer
            name={KIND_ICON[current.kind] ?? GENERIC_ICON}
            className={`mt-0.5 size-4 shrink-0 ${SEVERITY_ICON_CLASS[current.severity] ?? SEVERITY_ICON_CLASS.neutral}`}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{current.title}</span>
            <p className="text-xs leading-relaxed text-white/80">{current.body}</p>
          </div>
        </div>
        {insights.length > 1 && (
          <div className="flex items-center gap-1.5">
            {insights.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`توقع ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   قسم النشاط
   ============================================================ */

function ActivityTileSkeleton() {
  return (
    <div className="flex h-[140px] w-[150px] shrink-0 flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <Skeleton className="h-6 w-16" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2.5 w-14" />
      </div>
    </div>
  );
}

function ActivityStatTile({ tile }: { tile: ActivityTileData }) {
  const isUp = (tile.change ?? 0) >= 0;
  return (
    <div className="flex h-[140px] w-[150px] shrink-0 flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5">
        <span className="truncate text-xl font-semibold text-foreground">{tile.value}</span>
        {tile.suffix && <span className="text-[11px] text-muted-foreground">{tile.suffix}</span>}
        {tile.change != null && (
          <IconRenderer
            name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
            className={`size-3.5 ${isUp ? "text-emerald-600" : "text-red-500"}`}
          />
        )}
      </div>
      <div>
        <div className="text-xs font-medium text-foreground">{tile.label}</div>
        {tile.sub && <div className="text-[11px] text-muted-foreground">{tile.sub}</div>}
      </div>
    </div>
  );
}

function ActivitySection({ groups }: { groups: ActivityGroupData[] | null }) {
  const { ref, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useDragScroll();

  if (!groups) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-max gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {ACTIVITY_SKELETON_GROUP_SIZES.map((count, gi) => (
            <div key={gi} className="shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <div className="flex gap-3">
                {Array.from({ length: count }).map((_, i) => (
                  <ActivityTileSkeleton key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={`overflow-x-auto [&::-webkit-scrollbar]:hidden ${dragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
      >
        <div className="flex min-w-max gap-6">
          {groups.map((group) => (
            <div key={group.key} className="shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <IconRenderer name={group.icon} className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              </div>
              <div className="flex gap-3">
                {group.tiles.map((tile, i) => (
                  <ActivityStatTile key={i} tile={tile} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   المكوّن الرئيسي
   ============================================================ */

export interface AnalyticsOverviewProps {
  /** Period filter — the overview and its insights get the same params so the cards and the sentence describe the same period. Unset means the server's default period. */
  params?: OverviewParams;
}

export function AnalyticsOverview({ params }: AnalyticsOverviewProps) {
  const { data, isLoading, isError, isFetching, refetch, error } = useMyOverviewQuery(params);
  const rawOverview = data?.data?.overview;
  const overview = hasOverviewShape(rawOverview) ? rawOverview : undefined;
  const hasError = isError || (!isLoading && !overview);

  const insightsQuery = useMyInsightsQuery(params);
  const insights = insightsQuery.data?.data?.insights ?? [];

  const kpis = useMemo(() => (overview ? buildKpis(overview) : null), [overview]);
  const requestDistribution = useMemo(() => (overview ? buildRequestBars(overview) : null), [overview]);
  const activityGroups = useMemo(() => (overview ? buildActivityGroups(overview) : null), [overview]);

  if (hasError) {
    return <ErrorState error={error} isRetrying={isFetching} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {overview?.fx.stale && (
        <span className="flex items-center gap-1.5 text-xs text-amber-600">
          <IconRenderer name="warning_outlined" className="size-3.5" />
          أسعار الصرف قد تكون غير محدّثة
        </span>
      )}

      <KpiRow kpis={kpis} />

      <div className="grid grid-cols-1 gap-4">
        {requestDistribution ? (
          <OrdersDistributionCard bars={requestDistribution.bars} total={requestDistribution.total} />
        ) : (
          <OrdersDistributionSkeleton />
        )}
        {/* Insights are a bonus: shown while loading and when there is something to say, hidden on failure or an empty answer. */}
        {insightsQuery.isLoading ? (
          <InsightBannerSkeleton />
        ) : (
          insights.length > 0 && <InsightBanner insights={insights} />
        )}
      </div>

      <ActivitySection groups={activityGroups} />
    </div>
  );
}

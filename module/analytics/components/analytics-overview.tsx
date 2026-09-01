"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";

/* ============================================================
   بيانات تجريبية (بديل مؤقت لحد ما نربط الـ API)
   ============================================================ */

const KPIS: {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  change?: number | null;
  icon: iconName;
}[] = [
  { key: "customers", label: "الزبائن المسندين", value: 42, change: 8, icon: "users_outlined" },
  { key: "orders", label: "الطلبيات هالشهر", value: 128, change: 12, icon: "cart_outlined" },
  { key: "revenue", label: "قيمة المبيعات", value: "18,450,000", suffix: "ل.س", change: 5, icon: "revenue_outlined" },
  { key: "newCustomers", label: "زبائن جدد (إحالة)", value: 6, change: 20, icon: "add_user_outlined" },
  { key: "pending", label: "بانتظار التسليم", value: 4, change: -10, icon: "clock_outlined" },
  { key: "visits", label: "الزيارات هالأسبوع", value: 31, change: 3, icon: "map_outlined" },
];

const ORDERS_DISTRIBUTION = [
  { label: "مكتملة", value: 86 },
  { label: "قيد الانتظار", value: 22 },
  { label: "مرتجعة", value: 14 },
  { label: "ملغية", value: 6 },
];

const ACTIVITY_GROUPS: {
  key: string;
  title: string;
  icon: iconName;
  tiles: { value: string | number; suffix?: string; change: number | null; label: string; sub?: string }[];
}[] = [
  {
    key: "orders",
    title: "الطلبيات",
    icon: "cart_outlined",
    tiles: [
      { value: "18,450,000", suffix: "ل.س", change: 12, label: "إجمالي المبيعات", sub: "آخر 30 يوم" },
      { value: 128, change: 8, label: "عدد الطلبيات", sub: "آخر 30 يوم" },
      { value: 4, change: -15, label: "طلبيات معلّقة", sub: "بانتظار الشركة" },
    ],
  },
  {
    key: "visits",
    title: "الزيارات",
    icon: "map_outlined",
    tiles: [
      { value: 31, change: 4, label: "زيارات هالأسبوع", sub: "آخر 7 أيام" },
      { value: 5, change: -6, label: "محلات غير مزارة", sub: "هالأسبوع" },
    ],
  },
  {
    key: "customers",
    title: "الزبائن",
    icon: "users_outlined",
    tiles: [
      { value: 42, change: 8, label: "إجمالي الزبائن", sub: "مسندين للمندوب" },
      { value: 6, change: 20, label: "زبائن جدد", sub: "عبر كود الإحالة" },
    ],
  },
];

const FORECAST_BANNER: { indicator: "error" | "warning" | "success" | "info"; label: string; description: string }[] = [
  {
    indicator: "success",
    label: "توقع تجاوز الهدف",
    description: "بمعدلك الحالي، متوقع توصل لـ 145 طلبية نهاية الشهر — أعلى من هدفك بـ 5%.",
  },
  {
    indicator: "warning",
    label: "خطر فقدان زبائن",
    description: "إذا استمرت 5 محلات بدون زيارة لأسبوعين كمان، فيه احتمال يتوجهوا لمندوب تاني.",
  },
  {
    indicator: "info",
    label: "تغطية الزبائن",
    description: "بمعدل الزيارات الحالي، رح تغطي كل زبائنك المسندين خلال 3 أسابيع.",
  },
];

const ANALYSIS_INTRO =
  "بناءً على تحليل بيانات أداء المندوب خلال الفترة الحالية، وبافتراض استمرار نفس المعدلات لنهاية الشهر:";

const PERFORMANCE_PROJECTIONS: { metric: string; current: string; projected: string; trend: "up" | "down" | "steady" }[] = [
  {
    metric: "الطلبيات",
    current: "الوضع الحالي: 128 طلبية منذ بداية الشهر",
    projected: "التوقع: ≈ 145 طلبية نهاية الشهر (+13%)",
    trend: "up",
  },
  {
    metric: "الزيارات",
    current: "الوضع الحالي: 31 زيارة هالأسبوع",
    projected: "التوقع: تغطية كامل الزبائن المسندين خلال 3 أسابيع بنفس المعدل",
    trend: "up",
  },
  {
    metric: "الزبائن غير المُزارين",
    current: "الوضع الحالي: 5 محلات بدون زيارة من أكثر من أسبوع",
    projected: "التوقع: خطر فقدان 1-2 زبون خلال أسبوعين إذا استمر الوضع متل ما هو",
    trend: "down",
  },
  {
    metric: "المرتجعات",
    current: "الوضع الحالي: 11% من إجمالي الطلبيات مرتجعة",
    projected: "التوقع: بتضل ثابتة ضمن المعدل الطبيعي (10-12%)",
    trend: "steady",
  },
];

const PERFORMANCE_RECOMMENDATIONS = [
  "جدولة زيارة للزبائن الخمسة يلي ما تمت زيارتهم هالأسبوع قبل ما تفقدهم لمندوب تاني.",
  "الحفاظ على معدل الطلبيات الحالي لتحقيق أو تجاوز هدف الشهر.",
  "متابعة أسباب نسبة المرتجع كل فترة حتى تضل ضمن الحد الطبيعي.",
];

const TREND_ICON: Record<string, iconName> = {
  up: "arrow_up_outlined",
  down: "arrow_down_outlined",
  steady: "minus_outlined",
};

const TREND_CLASS: Record<string, string> = {
  up: "text-emerald-600 bg-emerald-500/10",
  down: "text-red-500 bg-red-500/10",
  steady: "text-muted-foreground bg-muted",
};

const INDICATOR_ICON: Record<string, iconName> = {
  error: "warning_outlined",
  warning: "warning_outlined",
  success: "success_outlined",
  info: "info_outlined",
};

const INDICATOR_ICON_CLASS: Record<string, string> = {
  error: "text-red-200",
  warning: "text-amber-200",
  success: "text-emerald-200",
  info: "text-white/80",
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

function KpiCard({ item }: { item: (typeof KPIS)[number] }) {
  const change = item.change ?? null;
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

function KpiRow({ loading }: { loading: boolean }) {
  const { ref, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useDragScroll();

  if (loading) {
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
      {KPIS.map((item) => (
        <KpiCard key={item.key} item={item} />
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

function OrdersDistributionCard() {
  const [sel, setSel] = useState(0);
  const values = ORDERS_DISTRIBUTION.map((d) => d.value);
  const total = values.reduce((s, v) => s + v, 0);
  const maxV = Math.max(...values, 1);

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
        {ORDERS_DISTRIBUTION.map((d, i) => {
          const isSel = sel === i;
          const h = (d.value / maxV) * 100;
          return (
            <button key={d.label} onClick={() => setSel(i)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
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
   بانر التوقعات (rotating)
   ============================================================ */

function InsightBannerSkeleton() {
  return (
    <div className="flex h-full min-h-[200px] flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Skeleton className="mt-0.5 h-4 w-4 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-1.5 w-5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function InsightBanner() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (FORECAST_BANNER.length < 2) return;
    const id = setInterval(() => setActive((p) => (p + 1) % FORECAST_BANNER.length), 5000);
    return () => clearInterval(id);
  }, []);

  const current = FORECAST_BANNER[active];

  return (
    <div className="relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium">توقعات وتنبؤات</span>
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium">
          <IconRenderer name="ai_outlined" className="size-3" />
          AI
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <IconRenderer name={INDICATOR_ICON[current.indicator]} className={`mt-0.5 size-4 shrink-0 ${INDICATOR_ICON_CLASS[current.indicator]}`} />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{current.label}</span>
            <p className="text-xs leading-relaxed text-white/80">{current.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {FORECAST_BANNER.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`توقع ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ملخص أداء المندوب
   ============================================================ */

function RepInsightsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-5 w-44" />
      </div>
      <div className="mb-5 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-4/5" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-2 border-t border-border pt-6">
        <Skeleton className="mb-2 h-3.5 w-48" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function RepInsights() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconRenderer name="ai_outlined" className="size-4" />
        </div>
        <h2 className="text-lg font-medium text-foreground">تحليل الأداء والتوقعات</h2>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{ANALYSIS_INTRO}</p>

      <ul className="space-y-3">
        {PERFORMANCE_PROJECTIONS.map((p, idx) => (
          <li key={idx} className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${TREND_CLASS[p.trend]}`}>
              <IconRenderer name={TREND_ICON[p.trend]} className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-sm font-semibold text-foreground">{p.metric}</div>
              <div className="text-xs leading-relaxed text-muted-foreground">{p.current}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-foreground">{p.projected}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-border pt-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">شو لازم يعمل المندوب بناءً عالتوقعات</h3>
        <ul className="list-disc space-y-2 ps-5">
          {PERFORMANCE_RECOMMENDATIONS.map((rec, idx) => (
            <li key={idx} className="text-sm leading-relaxed text-muted-foreground">
              {rec}
            </li>
          ))}
        </ul>
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

function ActivityStatTile({ tile }: { tile: (typeof ACTIVITY_GROUPS)[number]["tiles"][number] }) {
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
        <div className="text-[11px] text-muted-foreground">{tile.sub}</div>
      </div>
    </div>
  );
}

function ActivitySection({ loading }: { loading: boolean }) {
  const { ref, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useDragScroll();

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-max gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {ACTIVITY_GROUPS.map((group) => (
            <div key={group.key} className="shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <div className="flex gap-3">
                {group.tiles.map((_, i) => (
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
          {ACTIVITY_GROUPS.map((group) => (
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
  /** لا يوجد API فعلي بعد — القيم تجريبية دائمًا. ما زال بإمكان الصفحة الأم إظهار هيكل تحميل مبدئي. */
  isLoading?: boolean;
}

export function AnalyticsOverview({ isLoading = false }: AnalyticsOverviewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <KpiRow loading />
        <div className="grid grid-cols-1 gap-4">
          <OrdersDistributionSkeleton />
          <InsightBannerSkeleton />
        </div>
        <RepInsightsSkeleton />
        <ActivitySection loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <KpiRow loading={false} />

      <div className="grid grid-cols-1 gap-4">
        <OrdersDistributionCard />
        <InsightBanner />
      </div>

      <RepInsights />

      <ActivitySection loading={false} />
    </div>
  );
}

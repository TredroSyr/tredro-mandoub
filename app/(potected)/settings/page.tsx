"use client";

import { useMemo, useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import DateRangePicker, { type Range } from "@/components/ui/date-range-picker";
import { AnalyticsOverview, CurrencyFilter } from "@/module/analytics/components";
import { useMyOverviewQuery } from "@/module/analytics/hooks";
import type { OverviewParams } from "@/module/analytics/types";

export default function SettingsPage() {
  // Unset period / currency mean "the server's default" (the company's own currency), same as the dashboard's rep overview.
  const [range, setRange] = useState<Range>({});
  const [currency, setCurrency] = useState<string | undefined>();
  const params = useMemo<OverviewParams>(
    () => ({ date_from: range.from, date_to: range.to ?? range.from, currency }),
    [range, currency],
  );
  // Same key as the query inside AnalyticsOverview, so this is one shared request — it only tells the filter which currency the server answered in.
  const { data } = useMyOverviewQuery(params);

  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="report_outlined" className="size-4 text-primary" /> التحليلات والإحصائيات
      </h2>
      <DateRangePicker value={range} onChange={setRange} className="mb-2" />
      <CurrencyFilter
        value={currency ?? data?.data?.overview?.currency?.code}
        onChange={setCurrency}
        className="mb-3"
      />
      <AnalyticsOverview params={params} />
    </section>
  );
}

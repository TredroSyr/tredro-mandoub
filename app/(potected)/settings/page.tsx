"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import DateRangePicker, { type Range } from "@/components/ui/date-range-picker";
import { AnalyticsOverview } from "@/module/analytics/components";
import { toISODate } from "@/lib/rep-tour-data";

export default function SettingsPage() {
  const today = toISODate(new Date());
  const [range, setRange] = useState<Range>({ from: today, to: today });

  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="report_outlined" className="size-4 text-primary" /> التحليلات والإحصائيات
      </h2>
      <DateRangePicker value={range} onChange={setRange} className="mb-3" />
      <AnalyticsOverview />
    </section>
  );
}

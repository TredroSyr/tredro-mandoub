"use client";

import { useMemo, useState } from "react";
import DateRangePicker, { type Range } from "@/components/ui/date-range-picker";
import { ErrorState } from "@/components/tredro/error-state";
import { HomeSalesSection, HomeSummaryCards, HomeWarehouseSection } from "@/module/home/components";
import { useGetDashboardQuery } from "@/module/dashboard/hooks";
import { toISODate } from "@/lib/rep-tour-data";

export default function HomePage() {
  const today = toISODate(new Date());
  const [range, setRange] = useState<Range>({ from: today, to: today });

  const params = useMemo(
    () => (range.from || range.to ? { date_from: range.from, date_to: range.to } : undefined),
    [range.from, range.to],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useGetDashboardQuery(params);
  const dashboard = data?.data;

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  const showSkeleton = isLoading || !dashboard;

  return (
    <>
      <DateRangePicker value={range} onChange={setRange} />
      <HomeSummaryCards dashboard={dashboard} isLoading={showSkeleton} />
      <HomeSalesSection dashboard={dashboard} isLoading={showSkeleton} />
      <HomeWarehouseSection dashboard={dashboard} isLoading={showSkeleton} />
    </>
  );
}

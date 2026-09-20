"use client";

import { ErrorState } from "@/components/tredro/error-state";
import {
  HomeSalesSection,
  HomeWarehouseSection,
  HomeTransfersSection,
  HomeOverdueSection,
  HomeNearbyCustomersSection,
  HomeNewRequestsSection,
} from "@/module/home/components";
import { useGetDashboardQuery } from "@/module/dashboard/hooks";

export default function HomePage() {
  const { data, isLoading, isError: queryFailed, error, refetch, isFetching } = useGetDashboardQuery();
  // Cached data stays on screen when a refresh fails (e.g. offline).
  const isError = queryFailed && !data;
  const dashboard = data?.data;

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  const showSkeleton = isLoading || !dashboard;

  return (
    <>
      <HomeWarehouseSection dashboard={dashboard} isLoading={showSkeleton} />
      <HomeTransfersSection />
      <HomeOverdueSection />
      <HomeNearbyCustomersSection />
      <HomeNewRequestsSection />
      <HomeSalesSection />
    </>
  );
}

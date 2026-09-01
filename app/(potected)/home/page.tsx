"use client";

import { ErrorState } from "@/components/tredro/error-state";
import {
  HomeSalesSection,
  HomeWarehouseSection,
  HomeTransfersSection,
  HomeNearbyCustomersSection,
  HomeNewRequestsSection,
} from "@/module/home/components";
import { useGetDashboardQuery } from "@/module/dashboard/hooks";

export default function HomePage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useGetDashboardQuery();
  const dashboard = data?.data;

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  const showSkeleton = isLoading || !dashboard;

  return (
    <>
      <HomeWarehouseSection dashboard={dashboard} isLoading={showSkeleton} />
      <HomeTransfersSection />
      <HomeNearbyCustomersSection />
      <HomeNewRequestsSection />
      <HomeSalesSection />
    </>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/tredro/error-state";
import { needsErrorState } from "@/lib/network-status";
import { RequestCard, RequestCardSkeleton, RequestFilterTabs } from "@/module/orders/components";
import { useGetCustomerRequestsQuery } from "@/module/orders/hooks";
import { CustomerRequestStatus } from "@/module/orders/types";

export default function OrdersPage() {
  return (
    <Suspense fallback={<RequestCardSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Captured once on mount: a notification tap lands here with ?requestId=
  // to jump straight into that request's detail drawer.
  const [openRequestId] = useState<number | null>(() => {
    const id = searchParams.get("requestId");
    return id ? Number(id) : null;
  });

  const [filter, setFilter] = useState<CustomerRequestStatus | "all">("all");

  useEffect(() => {
    if (openRequestId != null) router.replace("/orders");
    // Only meant to strip the query param once, right after reading it above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data,
    isLoading,
    isError: queryFailed,
    error,
    isFetching,
    fetchStatus,
    refetch,
  } = useGetCustomerRequestsQuery(
    filter === "all" ? undefined : { status: filter },
    { refetchOnMount: "always" },
  );
  // Cached data stays on screen when a refresh fails (e.g. offline).
  const isError = needsErrorState({ isError: queryFailed, data, fetchStatus });
  const requests = data?.data?.requests ?? [];

  return (
    <>
      <RequestFilterTabs value={filter} onChange={setFilter} />

      <div className="mt-2 space-y-2.5">
        {isLoading && (
          <>
            <RequestCardSkeleton />
            <RequestCardSkeleton />
            <RequestCardSkeleton />
          </>
        )}

        {isError && (
          <ErrorState
            error={error}
            fetchStatus={fetchStatus}
            onRetry={() => refetch()}
            isRetrying={isFetching}
            className="rounded-2xl bg-muted/40 p-6 py-6"
          />
        )}

        {!isLoading && !isError && requests.length === 0 && (
          <p className="rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
            لا توجد طلبات ضمن هذا التصنيف.
          </p>
        )}

        {!isLoading &&
          !isError &&
          requests.map((request) => (
            <RequestCard key={request.id} request={request} autoOpen={request.id === openRequestId} />
          ))}
      </div>
    </>
  );
}

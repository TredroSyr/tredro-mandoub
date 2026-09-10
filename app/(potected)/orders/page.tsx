"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
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

  const { data, isLoading, isError, isFetching, refetch } = useGetCustomerRequestsQuery(
    filter === "all" ? undefined : { status: filter },
    { refetchOnMount: "always" },
  );
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
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/40 p-6 text-center">
            <IconRenderer name="warning_outlined" className="h-8 w-8 text-destructive/60" />
            <p className="text-[11px] text-muted-foreground">تعذّر تحميل الطلبات.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <IconRenderer name="refresh_outlined" className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
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

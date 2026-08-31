"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { RequestCard, RequestFilterTabs } from "@/module/orders/components";
import { useGetCustomerRequestsQuery } from "@/module/orders/hooks";
import { CustomerRequestStatus } from "@/module/orders/types";

export default function OrdersPage() {
  const [filter, setFilter] = useState<CustomerRequestStatus | "all">("all");

  const { data, isLoading, isError, isFetching, refetch } = useGetCustomerRequestsQuery(
    filter === "all" ? undefined : { status: filter },
  );
  const requests = data?.data?.requests ?? [];

  return (
    <>
      <RequestFilterTabs value={filter} onChange={setFilter} />

      <div className="mt-2 space-y-2.5">
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
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
            ما في طلبات ضمن هذا التصنيف.
          </p>
        )}

        {!isLoading && !isError && requests.map((request) => <RequestCard key={request.id} request={request} />)}
      </div>
    </>
  );
}

"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useGetCustomerRequestsQuery } from "@/module/orders/hooks";
import { RequestCard } from "@/module/orders/components/request-card";

const MAX_ITEMS = 3;

export function HomeNewRequestsSection() {
  const { data, isLoading } = useGetCustomerRequestsQuery({ status: "pending", page_size: MAX_ITEMS });
  const requests = [...(data?.data?.requests ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, MAX_ITEMS);

  if (isLoading) {
    return (
      <section className="mt-6">
        <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
          <IconRenderer name="cart_filled" className="size-4 text-primary" /> أحدث الطلبات الجديدة
        </h2>
        <div className="space-y-2">
          <SkeletonCard />
        </div>
      </section>
    );
  }

  if (requests.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="cart_filled" className="size-4 text-primary" /> أحدث الطلبات الجديدة
      </h2>
      <div className="space-y-2">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </section>
  );
}

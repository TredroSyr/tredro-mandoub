"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useGetCustomerRequestsQuery } from "@/module/orders/hooks";
import { RequestCard } from "@/module/orders/components/request-card";

const MAX_ITEMS = 3;

export function HomeNewRequestsSection() {
  const { data, isLoading } = useGetCustomerRequestsQuery({ status: "pending", page_size: MAX_ITEMS });
  const requests = [...(data?.data?.requests ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, MAX_ITEMS);

  // No skeleton here: this section is conditional (may end up empty). A
  // local skeleton would flash in and then collapse, causing a layout jump.
  // Stay hidden until we know there's something to render.
  if (isLoading || requests.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="cart_filled" className="size-4 text-primary" /> أحدث الطلبات الجديدة
      </h2>
      <div
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        dir="rtl"
      >
        {requests.map((request) => (
          <div key={request.id} className="w-[75%] shrink-0 snap-start xs:w-[55%] sm:w-80">
            <RequestCard request={request} />
          </div>
        ))}
      </div>
    </section>
  );
}

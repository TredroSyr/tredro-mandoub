"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  NewTransferForm,
  TransferCard,
} from "@/module/warehouse-requests/components";
import { useGetStockTransfersQuery } from "@/module/warehouse-requests/hooks";
import { StockTransferStatus } from "@/module/warehouse-requests/types";

const STATUS_FILTERS: { label: string; statuses: StockTransferStatus[] }[] = [
  { label: "بانتظار موافقة المستودع", statuses: ["pending"] },
  {
    label: "تم تعديل الكميات",
    statuses: ["modified_by_admin", "pending_rep_confirmation"],
  },
  { label: "جاهز للاستلام", statuses: ["confirmed"] },
  { label: "تم التسليم", statuses: ["received"] },
  { label: "ملغى", statuses: ["cancelled"] },
];

export default function MyOrdersPage() {
  const [tab, setTab] = useState<"orders" | "received">("orders");
  const [statusFilter, setStatusFilter] = useState<
    StockTransferStatus[] | null
  >(null);

  const received = useGetStockTransfersQuery();

  const receivedList = received.data?.data?.transfers ?? [];
  const filteredList = statusFilter
    ? receivedList.filter((t) => statusFilter.includes(t.status))
    : receivedList;
  const readyForPickupCount = receivedList.filter(
    (t) => t.status === "confirmed",
  ).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {(
          [
            ["orders", "طلب طلبية "],
            ["received", "الطلبات"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-colors ${
              tab === key
                ? "bg-card text-primary shadow-float"
                : "text-muted-foreground"
            }`}
          >
            {label}
            {/* {key === "received" && readyForPickupCount > 0 && (
              <span className="grid min-w-[18px] place-items-center rounded-full bg-success px-1 py-0.5 font-mono text-[10px] font-bold leading-none text-success-foreground">
                {readyForPickupCount}
              </span>
            )} */}
          </button>
        ))}
      </div>

      {tab === "orders" && <NewTransferForm />}

      {tab === "received" && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter(null)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
                statusFilter === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              الكل
            </button>
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter?.[0] === filter.statuses[0];
              return (
                <button
                  key={filter.label}
                  onClick={() => setStatusFilter(filter.statuses)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 space-y-2.5">
            {received.isLoading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {received.isError && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/40 p-6 text-center">
                <IconRenderer
                  name="warning_outlined"
                  className="h-8 w-8 text-destructive/60"
                />
                <p className="text-[11px] text-muted-foreground">
                  تعذّر تحميل طلبات الشركة.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => received.refetch()}
                  disabled={received.isFetching}
                >
                  <IconRenderer name="refresh_outlined" className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
              </div>
            )}

            {!received.isLoading &&
              !received.isError &&
              filteredList.length === 0 && (
                <p className="rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
                  لا توجد طلبات بعد.
                </p>
              )}

            {!received.isLoading &&
              !received.isError &&
              filteredList.map((transfer) => (
                <TransferCard key={transfer.id} transfer={transfer} />
              ))}
          </div>
        </>
      )}
    </>
  );
}

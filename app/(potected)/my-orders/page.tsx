"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { NewTransferForm, ReceivedTransferRow, TransferCard } from "@/module/warehouse-requests/components";
import { useGetStockTransfersQuery } from "@/module/warehouse-requests/hooks";

export default function MyOrdersPage() {
  const [tab, setTab] = useState<"orders" | "invoices">("orders");

  const transfers = useGetStockTransfersQuery(undefined, { enabled: tab === "orders" });
  const received = useGetStockTransfersQuery({ status: "received" }, { enabled: tab === "invoices" });

  const list = transfers.data?.data?.transfers ?? [];
  const invoices = received.data?.data?.transfers ?? [];

  return (
    <>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {(
          [
            ["orders", "طلبات المستودع"],
            ["invoices", "فواتير الشركة"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl py-2.5 text-xs font-bold transition-colors ${
              tab === key ? "bg-card text-primary shadow-float" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <>
          <NewTransferForm />

          <div className="mt-4 space-y-2.5">
            {transfers.isLoading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {transfers.isError && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/40 p-6 text-center">
                <IconRenderer name="warning_outlined" className="h-8 w-8 text-destructive/60" />
                <p className="text-[11px] text-muted-foreground">تعذّر تحميل الطلبات.</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => transfers.refetch()}
                  disabled={transfers.isFetching}
                >
                  <IconRenderer name="refresh_outlined" className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
              </div>
            )}

            {!transfers.isLoading && !transfers.isError && list.length === 0 && (
              <p className="rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
                ما في طلبات بعد.
              </p>
            )}

            {!transfers.isLoading &&
              !transfers.isError &&
              list.map((transfer) => <TransferCard key={transfer.id} transfer={transfer} />)}
          </div>
        </>
      )}

      {tab === "invoices" && (
        <div className="mt-4 space-y-2">
          {received.isLoading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {received.isError && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/40 p-6 text-center">
              <IconRenderer name="warning_outlined" className="h-8 w-8 text-destructive/60" />
              <p className="text-[11px] text-muted-foreground">تعذّر تحميل الفواتير.</p>
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

          {!received.isLoading && !received.isError && invoices.length === 0 && (
            <p className="rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
              ما في فواتير بعد.
            </p>
          )}

          {!received.isLoading &&
            !received.isError &&
            invoices.map((transfer) => <ReceivedTransferRow key={transfer.id} transfer={transfer} />)}
        </div>
      )}
    </>
  );
}

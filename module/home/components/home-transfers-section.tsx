"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useGetStockTransfersQuery } from "@/module/warehouse-requests/hooks";
import { TransferCard } from "@/module/warehouse-requests/components/transfer-card";
import type { StockTransferStatus } from "@/module/warehouse-requests/types";

/** Transfers the rep must act on: ready for pickup, or quantities the admin changed. */
const NEEDS_ACTION_STATUSES: StockTransferStatus[] = ["confirmed", "modified_by_admin", "pending_rep_confirmation"];

export function HomeTransfersSection() {
  const { data, isLoading } = useGetStockTransfersQuery({ page_size: 50 });
  const transfers = (data?.data?.transfers ?? []).filter((t) => NEEDS_ACTION_STATUSES.includes(t.status));

  if (isLoading) {
    return (
      <section className="mt-6">
        <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
          <IconRenderer name="warning_outlined" className="size-4 text-primary" /> طلبات تحتاج إجراء منك
        </h2>
        <div className="space-y-2">
          <SkeletonCard />
        </div>
      </section>
    );
  }

  if (transfers.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="warning_outlined" className="size-4 text-primary" /> طلبات تحتاج إجراء منك
        <span className="font-mono text-[11px] text-muted-foreground">{transfers.length}</span>
      </h2>
      <div className="space-y-2">
        {transfers.map((transfer) => (
          <TransferCard key={transfer.id} transfer={transfer} />
        ))}
      </div>
    </section>
  );
}

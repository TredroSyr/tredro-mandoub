"use client";

import Link from "next/link";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { SalesInvoiceRow } from "@/module/invoices/components";
import { useGetSalesInvoicesQuery } from "@/module/invoices/hooks";

const PREVIEW_COUNT = 3;

export function HomeSalesSection() {
  const { data, isLoading } = useGetSalesInvoicesQuery({ page_size: PREVIEW_COUNT });
  const invoices = data?.data?.invoices ?? [];
  const hasMore = (data?.data?.pagination?.count ?? 0) > invoices.length;

  return (
    <section className="mt-5">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="sales_filled" className="size-4 text-primary" /> أحدث المبيعات
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState variant="sales" size="sm" />
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <SalesInvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}

      {hasMore && (
        <Link
          href="/sales"
          className="mt-2.5 flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-primary"
        >
          عرض كل المبيعات
          <IconRenderer name="arrow_left_outlined" className="size-3.5" />
        </Link>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { InvoiceDetailDrawer, SalesInvoiceRow } from "@/module/invoices/components";
import { useGetSalesInvoicesQuery } from "@/module/invoices/hooks";

const PREVIEW_COUNT = 5;

export function HomeSalesSection() {
  const { data, isLoading } = useGetSalesInvoicesQuery({ page_size: PREVIEW_COUNT });
  const invoices = data?.data?.invoices ?? [];
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);

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
            <SalesInvoiceRow key={invoice.id} invoice={invoice} onClick={() => setDetailInvoiceId(invoice.id)} />
          ))}
        </div>
      )}

      <InvoiceDetailDrawer
        invoiceId={detailInvoiceId}
        open={detailInvoiceId != null}
        onOpenChange={(open) => !open && setDetailInvoiceId(null)}
      />
    </section>
  );
}

"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  ProductDetailsDrawer,
  ProductThumb,
} from "@/components/tredro/product-details-drawer";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { formatCurrency, formatQuantity } from "@/lib/format";
import { translateUnitName } from "@/module/warehouse-requests/lib/utils";
import type { DashboardData, DashboardWarehouseItem } from "@/module/dashboard/types";

export interface HomeWarehouseSectionProps {
  dashboard?: DashboardData;
  isLoading: boolean;
}

export function HomeWarehouseSection({ dashboard, isLoading }: HomeWarehouseSectionProps) {
  const warehouse = dashboard?.warehouse;
  const [selected, setSelected] = useState<DashboardWarehouseItem | null>(null);

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="checkout_filled" className="size-4 text-primary" /> مستودع السيارة
        {isLoading ? (
          <Skeleton className="h-3 w-14" />
        ) : (
          warehouse && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatQuantity(warehouse.total_quantity)} قطعة
            </span>
          )
        )}
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !warehouse ? (
        <EmptyState
          variant="warehouse"
          size="sm"
          title="لا يوجد مستودع سيارة مخصص لك حاليًا"
          description="يُرجى التواصل مع الإدارة لتخصيص مستودع سيارة لحسابك."
        />
      ) : warehouse.items.length === 0 ? (
        <EmptyState variant="warehouse" size="sm" />
      ) : (
        <div className="space-y-2">
          {warehouse.items.map((item) => (
            <WarehouseItemRow key={item.id} item={item} onOpen={setSelected} />
          ))}
        </div>
      )}

      <ProductDetailsDrawer
        product={
          selected && {
            name: selected.product_name,
            sku: selected.product_sku,
            barcode: selected.product_barcode,
            imageUrl: selected.image?.image,
            imageAlt: selected.image?.alt_text,
            unitName: selected.unit_name,
            price: selected.unit_price,
            quantity: selected.quantity,
            isLowStock: selected.is_low_stock,
          }
        }
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </section>
  );
}

function WarehouseItemRow({
  item,
  onOpen,
}: {
  item: DashboardWarehouseItem;
  onOpen: (item: DashboardWarehouseItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-start"
    >
      <ProductThumb interactive url={item.image?.image} alt={item.image?.alt_text || item.product_name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{item.product_name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {item.unit_price != null ? formatCurrency(item.unit_price) : "بدون سعر"} / {translateUnitName(item.unit_name)}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${
          item.is_low_stock ? "bg-warning/20 text-warning-foreground" : "bg-primary/12 text-primary"
        }`}
      >
        {formatQuantity(item.quantity)} قطعة
      </span>
    </button>
  );
}

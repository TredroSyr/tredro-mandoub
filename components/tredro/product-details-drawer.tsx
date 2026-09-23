"use client";

import type { ReactNode } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatCurrency, formatQuantity } from "@/lib/format";
import { translateUnitName } from "@/module/warehouse-requests/lib/utils";

export interface ProductDetails {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  unitName: string;
  price?: string | null;
  quantity?: string | null;
  quantityLabel?: string;
  isLowStock?: boolean | null;
}

export function ProductThumb({
  url,
  alt,
  className = "size-12",
}: {
  url?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-muted ${className}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <IconRenderer name="no_image_outlined" className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}

/** Tap hint shown on rows that open the details drawer. */
export function ProductTapHint() {
  return (
    <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-primary">
      <IconRenderer name="info_outlined" className="size-3" /> اضغط لعرض التفاصيل
    </span>
  );
}

export function ProductDetailsDrawer({
  product,
  onOpenChange,
}: {
  product: ProductDetails | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={product != null} onOpenChange={onOpenChange}>
      <DrawerContent className="mt-0 flex max-h-[85svh] flex-col rounded-t-[1.75rem] border-t border-border bg-card">
        {product && (
          <>
            <DrawerHeader className="flex shrink-0 flex-row items-start justify-between gap-3 border-b border-border pb-4 text-start">
              <DrawerTitle className="min-w-0 break-words text-sm font-extrabold">
                {product.name}
              </DrawerTitle>
              <DrawerClose>
                <Button variant="secondary" size="icon-sm" className="shrink-0">
                  <IconRenderer name="close_outlined" className="size-3.5" />
                </Button>
              </DrawerClose>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <ProductThumb
                url={product.imageUrl}
                alt={product.imageAlt || product.name}
                className="aspect-square w-full max-w-64 mx-auto rounded-2xl"
              />

              <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-background text-xs">
                <Row label="السعر">
                  {product.price != null ? formatCurrency(product.price) : "بدون سعر"} /{" "}
                  {translateUnitName(product.unitName)}
                </Row>
                {product.quantity != null && (
                  <Row label={product.quantityLabel ?? "الكمية بالسيارة"}>
                    <span className={product.isLowStock ? "text-warning-foreground" : undefined}>
                      {formatQuantity(product.quantity)} {translateUnitName(product.unitName)}
                      {product.isLowStock ? " · مخزون منخفض" : ""}
                    </span>
                  </Row>
                )}
                <Row label="الوحدة">{translateUnitName(product.unitName)}</Row>
                {product.sku && <Row label="رمز المنتج (SKU)">{product.sku}</Row>}
                {product.barcode && <Row label="الباركود">{product.barcode}</Row>}
              </dl>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-end font-mono font-bold">{children}</dd>
    </div>
  );
}

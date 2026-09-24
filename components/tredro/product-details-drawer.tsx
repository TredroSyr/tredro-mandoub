"use client";

import { useState, type ReactNode } from "react";
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
  className = "size-14",
  interactive = false,
}: {
  url?: string | null;
  alt: string;
  className?: string;
  /** Adds an eye badge signalling that tapping opens the details drawer. */
  interactive?: boolean;
}) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="grid size-full place-items-center overflow-hidden rounded-xl bg-muted">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} loading="lazy" className="size-full object-cover" />
        ) : (
          <IconRenderer name="no_image_outlined" className="size-6 text-muted-foreground" />
        )}
      </div>
      {interactive && (
        <span className="absolute -bottom-1.5 -end-1.5 grid size-6 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow">
          <IconRenderer name="eye_visible_outlined" className="size-3.5" />
        </span>
      )}
    </div>
  );
}

// Opens at half height; drag the handle up to expand to almost full screen.
const SNAP_POINTS: number[] = [0.5, 1];

export function ProductDetailsDrawer({
  product,
  onOpenChange,
}: {
  product: ProductDetails | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [snap, setSnap] = useState<number>(SNAP_POINTS[0]);

  return (
    <Drawer
      open={product != null}
      onOpenChange={(open) => {
        if (!open) setSnap(SNAP_POINTS[0]);
        onOpenChange(open);
      }}
      showSwipeHandle
      snapPoints={SNAP_POINTS}
      snapPoint={snap}
      onSnapPointChange={(next) => typeof next === "number" && setSnap(next)}
    >
      <DrawerContent className="mt-0 rounded-t-[1.75rem] border-t border-border bg-card">
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

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              <ProductThumb
                url={product.imageUrl}
                alt={product.imageAlt || product.name}
                className="aspect-square w-full max-w-64 mx-auto rounded-2xl"
              />

              <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-background text-xs">
                <Row label="السعر">
                  {product.price != null ? formatCurrency(product.price) : "بدون سعر"} /{" "}
                  قطعة
                </Row>
                {product.quantity != null && (
                  <Row label={product.quantityLabel ?? "الكمية بالسيارة"}>
                    <span className={product.isLowStock ? "text-warning-foreground" : undefined}>
                      {formatQuantity(product.quantity)} قطعة
                      {product.isLowStock ? " · مخزون منخفض" : ""}
                    </span>
                  </Row>
                )}
                <Row label="الوحدة">قطعة</Row>
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

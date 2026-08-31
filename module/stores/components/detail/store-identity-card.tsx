import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PhoneInput } from "@/components/tredro/phone-input";
import type { Customer } from "@/module/customers/types";

export interface StoreIdentityCardProps {
  customer?: Customer;
  isLoading: boolean;
}

export function StoreIdentityCard({ customer, isLoading }: StoreIdentityCardProps) {
  if (isLoading || !customer) {
    return (
      <section className="mt-3 rounded-3xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-5 w-40 rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  const hasCoords = customer.latitude != null && customer.longitude != null;

  return (
    <section className="mt-3 rounded-3xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
            hasCoords ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
          }`}
        >
          <IconRenderer name={hasCoords ? "category_outlined" : "warning_outlined"} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <PhoneInput value={customer.phone} readOnly />
          {!customer.is_active && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Badge variant="secondary">غير نشط</Badge>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

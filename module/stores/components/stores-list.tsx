import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { PhoneInput } from "@/components/tredro/phone-input";
import { formatCurrency } from "@/lib/format";
import { WORK_DAYS_LABELS, getCustomerWorkDays } from "@/module/customers/lib/utils";
import type { Customer } from "@/module/customers/types";

export interface StoresListProps {
  customers: Customer[];
  isLoading: boolean;
  isEmpty: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  onSelect: (customerId: number) => void;
}

export function StoresList({
  customers,
  isLoading,
  isEmpty,
  hasFilters,
  onClearFilters,
  onSelect,
}: StoresListProps) {
  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="mt-4">
        <EmptyState variant="stores" size="sm" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          variant="stores"
          size="sm"
          title="لا توجد محلات مطابقة لبحثك"
          description="يُرجى تعديل كلمة البحث أو عوامل التصفية المستخدمة."
        >
          {hasFilters && (
            <Button size="sm" variant="secondary" className="mt-6" onClick={onClearFilters}>
              مسح عوامل التصفية
            </Button>
          )}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {customers.map((customer) => (
        <StoreCard key={customer.id} customer={customer} onSelect={() => onSelect(customer.id)} />
      ))}
    </div>
  );
}

function StoreCard({ customer, onSelect }: { customer: Customer; onSelect: () => void }) {
  const workDays = getCustomerWorkDays(customer);
  const dayLabel = workDays.length > 0 ? WORK_DAYS_LABELS[workDays[0]] ?? workDays[0] : "—";
  const balanceDue = parseFloat(customer.balance_due) || 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-start transition-all hover:border-primary/50 ${
        customer.is_active ? "border-border bg-background/60" : "border-border bg-muted/30 opacity-70"
      }`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <IconRenderer name="category_filled" className="w-6 h-6" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-bold">{customer.name}</h4>
            {!customer.is_active && <Badge variant="secondary">غير نشط</Badge>}
          </div>
          {customer.address ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{customer.address}</p>
          ) : (
            <PhoneInput value={customer.phone} readOnly className="mt-0.5" />
          )}
        </div>
        <IconRenderer name="arrow_left_outlined" className="mt-1 w-4 h-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-secondary py-2">
          <p className="text-[10px] text-muted-foreground">اليوم</p>
          <p className="text-[11px] font-bold">{dayLabel}</p>
        </div>
        <div className="rounded-xl bg-success/12 py-2">
          <p className="text-[10px] text-muted-foreground">مدفوع</p>
          <p className="font-mono text-[11px] font-bold text-success">{formatCurrency(customer.paid_amount)}</p>
        </div>
        <div className={`rounded-xl py-2 ${balanceDue > 0 ? "bg-warning/20" : "bg-muted"}`}>
          <p className="text-[10px] text-muted-foreground">متبقٍ</p>
          <p className="font-mono text-[11px] font-bold">{formatCurrency(customer.balance_due)}</p>
        </div>
      </div>
    </button>
  );
}

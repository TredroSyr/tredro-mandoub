"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard, SkeletonStat } from "@/components/ui/skeleton";
import { useGetCustomersQuery } from "@/module/customers/hooks";
import { Customer } from "@/module/customers/types";
import { WORK_DAYS_LABELS, formatCurrency, getCustomerWorkDays } from "@/module/customers/lib/utils";

type ActiveFilter = "all" | "active" | "inactive";

function matchesSearch(customer: Customer, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    customer.name.toLowerCase().includes(q) ||
    customer.phone.toLowerCase().includes(q) ||
    customer.address.toLowerCase().includes(q)
  );
}

export default function StoresPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<ActiveFilter>("all");

  // The stores list is the rep's whole assigned set and is not paginated,
  // so we fetch it once and filter client-side — that keeps the stat
  // tiles accurate against the true total regardless of the active filter.
  const { data, isLoading, isError, refetch, isFetching } = useGetCustomersQuery();

  const allCustomers = useMemo(() => data?.data?.customers ?? [], [data]);
  const total = data?.data?.total ?? allCustomers.length;
  const activeCount = allCustomers.filter((c) => c.is_active).length;
  const inactiveCount = allCustomers.length - activeCount;

  const hasFilters = search.trim().length > 0 || filterActive !== "all";

  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((c) => {
      if (filterActive !== "all" && c.is_active !== (filterActive === "active")) return false;
      return matchesSearch(c, search);
    });
  }, [allCustomers, filterActive, search]);

  return (
    <>
      {/* Stats row */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      ) : !isError ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-primary/8 p-2 text-center">
            <p className="text-2xl font-bold text-primary">{total}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي</p>
          </div>
          <div className="rounded-2xl bg-success/8 p-2 text-center">
            <p className="text-2xl font-bold text-success">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground">نشط</p>
          </div>
          <div className="rounded-2xl bg-muted p-2 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{inactiveCount}</p>
            <p className="text-[10px] text-muted-foreground">غير نشط</p>
          </div>
        </div>
      ) : null}

      {/* Search and Filter */}
      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="ابحث بالاسم أو الهاتف أو العنوان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={filterActive === "all" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterActive("all")}
            className="text-xs px-3"
          >
            الكل
          </Button>
          <Button
            variant={filterActive === "active" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterActive("active")}
            className="text-xs px-3"
          >
            نشط
          </Button>
          <Button
            variant={filterActive === "inactive" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterActive("inactive")}
            className="text-xs px-3"
          >
            غير نشط
          </Button>
        </div>
      </div>

      {/* Customers List */}
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <IconRenderer
              name="warning_outlined"
              className="w-12 h-12 text-destructive/60"
            />
            <p className="text-sm text-muted-foreground">
              تعذّر تحميل قائمة المحلات. تحقق من اتصالك وحاول مجددًا.
            </p>
            <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <IconRenderer name="refresh_outlined" className="w-4 h-4" />
              {isFetching ? "جارِ إعادة المحاولة..." : "إعادة المحاولة"}
            </Button>
          </div>
        ) : allCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <IconRenderer
              name="category_outlined"
              className="w-12 h-12 text-muted-foreground/50"
            />
            <p className="text-sm text-muted-foreground">لا يوجد محلات مسجّلة بعد</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <IconRenderer
              name="search_error_outlined"
              className="w-12 h-12 text-muted-foreground/50"
            />
            <p className="text-sm text-muted-foreground">لا يوجد محلات مطابقة لبحثك</p>
            {hasFilters && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setFilterActive("all");
                }}
              >
                مسح الفلاتر
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCustomers.map((customer) => {
              const workDays = getCustomerWorkDays(customer);
              const dayLabel = workDays.length > 0 ? WORK_DAYS_LABELS[workDays[0]] ?? workDays[0] : "—";
              const balanceDue = parseFloat(customer.balance_due) || 0;

              return (
                <button
                  key={customer.id}
                  onClick={() => router.push(`/stores/detail?id=${customer.id}`)}
                  className={`w-full rounded-2xl border p-4 text-start transition-all hover:border-primary/50 ${
                    customer.is_active
                      ? "border-border bg-background/60"
                      : "border-border bg-muted/30 opacity-70"
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
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {customer.address || customer.phone}
                      </p>
                    </div>
                    <IconRenderer
                      name="arrow_left_outlined"
                      className="mt-1 w-4 h-4 shrink-0 text-muted-foreground"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-secondary py-2">
                      <p className="text-[10px] text-muted-foreground">اليوم</p>
                      <p className="text-[11px] font-bold">{dayLabel}</p>
                    </div>
                    <div className="rounded-xl bg-success/12 py-2">
                      <p className="text-[10px] text-muted-foreground">مدفوع</p>
                      <p className="font-mono text-[11px] font-bold text-success">
                        {formatCurrency(customer.paid_amount)}
                      </p>
                    </div>
                    <div className={`rounded-xl py-2 ${balanceDue > 0 ? "bg-warning/20" : "bg-muted"}`}>
                      <p className="text-[10px] text-muted-foreground">متبقٍ</p>
                      <p className="font-mono text-[11px] font-bold">
                        {formatCurrency(customer.balance_due)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

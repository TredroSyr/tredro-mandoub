"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SkeletonCard } from "@/components/ui/skeleton";
import { toISODate } from "@/lib/rep-tour-data";
import { useGetCustomersQuery } from "@/module/customers/hooks";
import { useGetDashboardQuery } from "@/module/dashboard/hooks";
import { getCurrentPosition } from "@/module/map/lib/geo";
import { distanceKm } from "@/module/map/lib/tour-data";
import { WORK_DAYS_LABELS, getCustomerWorkDays } from "@/module/customers/lib/utils";

const MAX_ITEMS = 3;

export function HomeNearbyCustomersSection() {
  const router = useRouter();
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentPosition()
      .then((pos) => {
        if (!cancelled) setOrigin(pos);
      })
      .catch(() => {
        // No permission / no fix — section stays hidden, per spec.
      })
      .finally(() => {
        if (!cancelled) setLocating(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery();
  const customers = useMemo(() => customersData?.data?.customers ?? [], [customersData]);

  const today = toISODate(new Date());
  const { data: dashboardData, isLoading: isLoadingDashboard } = useGetDashboardQuery({
    date_from: today,
    date_to: today,
  });
  const visitedTodayIds = useMemo(
    () => new Set((dashboardData?.data.sales.invoices ?? []).map((invoice) => invoice.customer)),
    [dashboardData],
  );

  const nearest = useMemo(() => {
    if (!origin) return [];
    return customers
      .filter((c) => c.latitude != null && c.longitude != null && !visitedTodayIds.has(c.id))
      .map((c) => ({ customer: c, distance: distanceKm(origin, [c.latitude!, c.longitude!]) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_ITEMS);
  }, [customers, origin, visitedTodayIds]);

  const isLoading = locating || isLoadingCustomers || isLoadingDashboard;

  if (isLoading) {
    return (
      <section className="mt-6">
        <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
          <IconRenderer name="location_filled" className="size-4 text-primary" /> أقرب المحلات غير المُزارة
        </h2>
        <div className="space-y-2">
          <SkeletonCard />
        </div>
      </section>
    );
  }

  if (nearest.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold">
        <IconRenderer name="location_filled" className="size-4 text-primary" /> أقرب المحلات غير المُزارة
      </h2>
      <div className="space-y-2">
        {nearest.map(({ customer, distance }) => {
          const workDays = getCustomerWorkDays(customer);
          const dayLabel = workDays.length > 0 ? WORK_DAYS_LABELS[workDays[0]] ?? workDays[0] : "—";
          return (
            <button
              key={customer.id}
              onClick={() => router.push(`/stores/detail?id=${customer.id}`)}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-start"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <IconRenderer name="store_filled" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{customer.name}</p>
                {customer.address ? (
                  <p className="truncate text-[11px] text-muted-foreground">{customer.address}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">يوم الزيارة: {dayLabel}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 font-mono text-[11px] font-bold text-primary">
                {distance < 1 ? `${Math.round(distance * 1000)} م` : `${distance.toFixed(1)} كم`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

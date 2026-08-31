"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/tredro/error-state";
import { StoresStats, StoresFilters, StoresList, type StoreDayFilter } from "@/module/stores/components";
import { useGetCustomersQuery } from "@/module/customers/hooks";
import { Customer } from "@/module/customers/types";
import { getTodayDayKey } from "@/module/map/lib/tour-data";
import { filterCustomersByDay } from "@/module/customers/lib/utils";

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
  const [day, setDay] = useState<StoreDayFilter>(getTodayDayKey());

  // The stores list is the rep's whole assigned set and is not paginated,
  // so we fetch it once and filter client-side — that keeps the stat
  // tiles accurate against the true total regardless of the day filter.
  const { data, isLoading, isError, error, refetch, isFetching } = useGetCustomersQuery();

  const allCustomers = useMemo(() => data?.data?.customers ?? [], [data]);
  const total = data?.data?.total ?? allCustomers.length;
  const activeCount = allCustomers.filter((c) => c.is_active).length;
  const inactiveCount = allCustomers.length - activeCount;

  const hasFilters = search.trim().length > 0 || day !== "all";

  const filteredCustomers = useMemo(() => {
    const byDay = day === "all" ? allCustomers : filterCustomersByDay(allCustomers, day);
    return byDay.filter((c) => matchesSearch(c, search));
  }, [allCustomers, day, search]);

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  return (
    <>
      <StoresStats total={total} activeCount={activeCount} inactiveCount={inactiveCount} isLoading={isLoading} />

      <StoresFilters
        search={search}
        onSearchChange={setSearch}
        day={day}
        onDayChange={setDay}
      />

      <StoresList
        customers={filteredCustomers}
        isLoading={isLoading}
        isEmpty={allCustomers.length === 0}
        hasFilters={hasFilters}
        onClearFilters={() => {
          setSearch("");
          setDay("all");
        }}
        onSelect={(id) => router.push(`/stores/detail?id=${id}`)}
      />
    </>
  );
}

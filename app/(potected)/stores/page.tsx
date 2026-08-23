"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  useGetCustomersQuery,
  useGetCustomerStatsQuery,
} from "@/module/customers/hooks";
import { Customer } from "@/module/customers/types";
import { distanceKm } from "@/module/map/lib/tour-data";
import { ALEPPO_CENTER } from "@/module/map/lib/tour-data";
import { Skeleton, SkeletonCard, SkeletonStat } from "@/components/ui/skeleton";

const WORK_DAYS_LABELS: Record<string, string> = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const queryParams = {
    ...(search && { search }),
    ...(filterActive !== "all" && { is_active: filterActive === "active" }),
  };

  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery(
    search || filterActive !== "all" ? queryParams : undefined,
  );
  const { data: statsData, isLoading: isLoadingStats } = useGetCustomerStatsQuery();

  const customers = customersData?.data?.customers ?? [];
  const stats = statsData?.data;

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header Stats */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="text-lg font-extrabold mb-3">العملاء</h1>
        
        {/* Stats Row */}
        {isLoadingStats ? (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-xl bg-primary/8">
              <p className="text-2xl font-bold text-primary">{stats.total_customers}</p>
              <p className="text-[10px] text-muted-foreground">إجمالي</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-success/8">
              <p className="text-2xl font-bold text-success">{stats.active_customers}</p>
              <p className="text-[10px] text-muted-foreground">نشط</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-muted">
              <p className="text-2xl font-bold text-muted-foreground">{stats.inactive_customers}</p>
              <p className="text-[10px] text-muted-foreground">غير نشط</p>
            </div>
          </div>
        ) : null}

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="ابحث بالاسم أو الهاتف..."
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
      </div>

      {/* Customers List */}
      <div className="p-4">
        {isLoadingCustomers ? (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <IconRenderer
              name="category_outlined"
              className="w-12 h-12 text-muted-foreground/50"
            />
            <p className="text-sm text-muted-foreground">
              {search ? "لا يوجد عملاء مطابقين للبحث" : "لا يوجد عملاء مسجلين بعد"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((customer) => {
              const distance = distanceKm(ALEPPO_CENTER, [customer.latitude, customer.longitude]);
              return (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`w-full rounded-2xl border p-4 text-start transition-all hover:border-primary/50 ${
                    customer.is_active
                      ? "border-border bg-background/60"
                      : "border-border bg-muted/30 opacity-70"
                  }`}
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                    <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                      <IconRenderer
                        name="map_filled"
                        className="w-6 h-6"
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm font-bold">{customer.name}</h4>
                        <Badge variant={customer.is_active ? "default" : "secondary"}>
                          {customer.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {customer.phone}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary">
                          {distance.toFixed(1)} كم
                        </Badge>
                        {customer.assigned_reps_details[0]?.work_days?.length > 0 && (
                          <Badge variant="outline">
                            {customer.assigned_reps_details[0].work_days
                              .map((d) => WORK_DAYS_LABELS[d] || d)
                              .join(", ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <Drawer
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DrawerContent
          className="z-[2600] mt-0 h-[75svh] rounded-t-[1.75rem] border-t border-glass-border bg-card/95 shadow-sheet backdrop-blur-xl"
        >
          {selectedCustomer && (
            <>
              <DrawerHeader className="grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pb-3 pt-1 text-start">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                    تفاصيل العميل
                  </p>
                  <DrawerTitle className="mt-0.5 truncate text-base font-extrabold">
                    {selectedCustomer.name}
                  </DrawerTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedCustomer.phone}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <Badge variant={selectedCustomer.is_active ? "default" : "secondary"}>
                      {selectedCustomer.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                    <Badge variant="secondary">
                      <IconRenderer name="map_outlined" className="w-4 h-4 inline ms-1" />
                      {distanceKm(ALEPPO_CENTER, [selectedCustomer.latitude, selectedCustomer.longitude]).toFixed(1)} كم
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedCustomer(null)}
                  aria-label="إغلاق"
                  variant="secondary"
                  size="icon-sm"
                >
                  <IconRenderer name="close_outlined" className="w-6 h-6" />
                </Button>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Contact Info */}
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold text-primary">
                    <IconRenderer name="user_outlined" className="w-5 h-5" />{" "}
                    المعلومات
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.email && (
                      <div className="flex justify-between items-center p-2 rounded-xl bg-muted/50">
                        <span className="text-xs text-muted-foreground">البريد الإلكتروني</span>
                        <span className="text-xs font-medium">{selectedCustomer.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-2 rounded-xl bg-muted/50">
                      <span className="text-xs text-muted-foreground">الإحداثيات</span>
                      <span className="text-xs font-mono">
                        {selectedCustomer.latitude.toFixed(5)}, {selectedCustomer.longitude.toFixed(5)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-muted/50">
                      <span className="text-xs text-muted-foreground">تاريخ التسجيل</span>
                      <span className="text-xs font-medium">
                        {new Date(selectedCustomer.created_at).toLocaleDateString("ar-SY")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Reps */}
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold text-primary">
                    <IconRenderer name="users_outlined" className="w-5 h-5" />{" "}
                    المندوبون المعينون ({selectedCustomer.assigned_reps_count})
                  </h4>
                  {selectedCustomer.assigned_reps_details.length === 0 ? (
                    <p className="rounded-2xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
                      لا يوجد مندوبين معينين لهذا العميل.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.assigned_reps_details.map((rep) => (
                        <div
                          key={rep.id}
                          className="rounded-2xl bg-primary/6 p-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold">{rep.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {rep.referral_code}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {rep.phone}
                          </p>
                          {rep.work_days.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {rep.work_days.map((day) => (
                                <Badge key={day} variant="outline" className="text-[10px]">
                                  {WORK_DAYS_LABELS[day] || day}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-4">
                <Button
                  className="w-full py-3.5 text-sm"
                  onClick={() => {
                    // TODO: Navigate to map with this customer
                    setSelectedCustomer(null);
                  }}
                >
                  <IconRenderer name="map_outlined" className="w-6 h-6" /> عرض على الخريطة
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

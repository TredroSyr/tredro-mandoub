"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Skeleton, SkeletonCard, SkeletonStat } from "@/components/ui/skeleton";
import {
  useGetCustomerByIdQuery,
  useGetCustomerPaymentsQuery,
  useGetCustomerRequestsQuery,
  useGetCustomerReturnInvoicesQuery,
  useGetCustomerSalesInvoicesQuery,
} from "@/module/customers/hooks";
import { WORK_DAYS_LABELS, formatCurrency, getCustomerWorkDays } from "@/module/customers/lib/utils";
import { iconName } from "@/assets/icons/iconRenderer/types";

type Tab = "requests" | "invoices" | "payments" | "returns";

const TABS: { key: Tab; label: string; icon: iconName }[] = [
  { key: "requests", label: "الطلبات", icon: "re_order_filled" },
  { key: "invoices", label: "الفواتير", icon: "card_filled" },
  { key: "payments", label: "الدفعات", icon: "money_filled" },
  { key: "returns", label: "المرتجعات", icon: "undo_filled" },
];

export default function StoreDetailPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="جارِ التحميل...">
          <div />
        </AppShell>
      }
    >
      <StoreDetailContent />
    </Suspense>
  );
}

function StoreDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const customerId = id ? Number(id) : null;

  const { data, isLoading, isError, refetch, isFetching } = useGetCustomerByIdQuery(customerId);
  const customer = data?.data?.customer;

  const [tab, setTab] = useState<Tab>("requests");

  const requestsQuery = useGetCustomerRequestsQuery(customerId);
  const invoicesQuery = useGetCustomerSalesInvoicesQuery(customerId);
  const paymentsQuery = useGetCustomerPaymentsQuery(customerId);
  const returnsQuery = useGetCustomerReturnInvoicesQuery(customerId);

  if (!customerId) {
    return (
      <AppShell title="المحل غير موجود">
        <Link href="/stores" className="text-sm font-bold text-primary">
          العودة لقائمة المحلات
        </Link>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell title="جارِ التحميل...">
        <div className="grid grid-cols-3 gap-2">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <div className="mt-4 space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </AppShell>
    );
  }

  if (isError || !customer) {
    return (
      <AppShell title="تعذّر تحميل بيانات المحل">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <IconRenderer name="warning_outlined" className="w-12 h-12 text-destructive/60" />
          <p className="text-sm text-muted-foreground">
            {isError ? "حدث خطأ أثناء تحميل بيانات المحل." : "هذا المحل غير موجود أو غير معيّن لك."}
          </p>
          {isError && (
            <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <IconRenderer name="refresh_outlined" className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          )}
          <Link href="/stores" className="text-xs font-bold text-primary">
            العودة لقائمة المحلات
          </Link>
        </div>
      </AppShell>
    );
  }

  const workDays = getCustomerWorkDays(customer);
  const balanceDue = parseFloat(customer.balance_due) || 0;
  const hasCoords = customer.latitude != null && customer.longitude != null;

  return (
    <AppShell title={customer.name} subtitle="Store">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/stores">المحلات</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{customer.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* بطاقة الهوية */}
      <section className="mt-3 rounded-3xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
              hasCoords ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
            }`}
          >
            <IconRenderer
              name={hasCoords ? "category_outlined" : "warning_outlined"}
              className="h-6 w-6"
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-extrabold leading-tight">{customer.name}</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
              {customer.phone}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {workDays.length > 0 && (
                <Badge>
                  <IconRenderer name="calendar_outlined" className="w-4 h-4" />
                  {workDays.map((d) => WORK_DAYS_LABELS[d] ?? d).join("، ")}
                </Badge>
              )}
              {!hasCoords && (
                <Badge variant="outline" className="text-warning">
                  <IconRenderer name="warning_outlined" className="w-4 h-4 ms-1" />
                  بدون موقع على الخريطة
                </Badge>
              )}
              {!customer.is_active && <Badge variant="secondary">غير نشط</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* الوضع المالي */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-border bg-card py-3">
          <p className="text-[10px] text-muted-foreground">إجمالي الفواتير</p>
          <p className="mt-1 font-mono text-[11px] font-bold">{formatCurrency(customer.total_invoiced)}</p>
        </div>
        <div className="rounded-2xl bg-success/12 py-3">
          <p className="text-[10px] text-muted-foreground">المدفوع</p>
          <p className="mt-1 font-mono text-[11px] font-bold text-success">
            {formatCurrency(customer.paid_amount)}
          </p>
        </div>
        <div className={`rounded-2xl py-3 ${balanceDue > 0 ? "bg-warning/20" : "bg-muted"}`}>
          <p className="text-[10px] text-muted-foreground">المتبقي</p>
          <p className="mt-1 font-mono text-[11px] font-bold">{formatCurrency(customer.balance_due)}</p>
        </div>
      </div>

      <a
        href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-primary"
      >
        <IconRenderer name="whatsapp_outlined" className="size-4" /> <span dir="ltr">{customer.phone}</span>
      </a>

      {/* تبويبات */}
      <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-secondary p-1">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold transition-colors ${
              tab === key ? "bg-card text-primary shadow-float" : "text-muted-foreground"
            }`}
          >
            <IconRenderer name={icon} className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "requests" && <RequestsTab query={requestsQuery} />}
      {tab === "invoices" && <InvoicesTab query={invoicesQuery} />}
      {tab === "payments" && <PaymentsTab query={paymentsQuery} />}
      {tab === "returns" && <ReturnsTab query={returnsQuery} />}
    </AppShell>
  );
}

function TabSkeleton() {
  return (
    <div className="mt-4 space-y-2">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
}

function TabError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/40 p-6 text-center">
      <IconRenderer name="warning_outlined" className="w-8 h-8 text-destructive/60" />
      <p className="text-[11px] text-muted-foreground">تعذّر تحميل هذه البيانات.</p>
      <Button size="sm" variant="secondary" onClick={onRetry} disabled={isRetrying}>
        <IconRenderer name="refresh_outlined" className="w-4 h-4" />
        إعادة المحاولة
      </Button>
    </div>
  );
}

function TabEmpty({ label }: { label: string }) {
  return (
    <p className="mt-4 rounded-2xl bg-muted/60 p-4 text-center text-[11px] text-muted-foreground">
      {label}
    </p>
  );
}

function RequestsTab({ query: q }: { query: ReturnType<typeof useGetCustomerRequestsQuery> }) {
  if (q.isLoading) return <TabSkeleton />;
  if (q.isError) return <TabError onRetry={() => q.refetch()} isRetrying={q.isFetching} />;
  const requests = q.data?.data?.requests ?? [];
  if (requests.length === 0) return <TabEmpty label="ما في طلبات سابقة." />;

  return (
    <div className="mt-4 space-y-2">
      {requests.map((r) => (
        <article key={r.id} className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString("ar-SY")}
            </p>
            <Badge variant={r.status === "pending" ? "warning" : "secondary"}>
              {r.status === "pending" ? "قيد الانتظار" : r.status}
            </Badge>
          </div>
          <ul className="mt-2 space-y-1">
            {r.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 text-[11px]">
                <span className="truncate text-muted-foreground">{l.product_name}</span>
                <span className="shrink-0 font-mono">
                  ×{Math.round(parseFloat(l.desired_quantity))} {l.unit_name}
                </span>
              </li>
            ))}
          </ul>
          {r.fulfilled_by_invoice_number && (
            <p className="mt-2 border-t border-border pt-2 text-[10px] text-success">
              نُفِّذ عبر الفاتورة {r.fulfilled_by_invoice_number}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function InvoicesTab({ query: q }: { query: ReturnType<typeof useGetCustomerSalesInvoicesQuery> }) {
  if (q.isLoading) return <TabSkeleton />;
  if (q.isError) return <TabError onRetry={() => q.refetch()} isRetrying={q.isFetching} />;
  const invoices = q.data?.data?.invoices ?? [];
  if (invoices.length === 0) return <TabEmpty label="ما في فواتير بعد." />;

  return (
    <div className="mt-4 space-y-2">
      {invoices.map((i) => (
        <div
          key={i.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
        >
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] font-bold">{i.number}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {new Date(i.date).toLocaleDateString("ar-SY")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-mono text-[11px]">{formatCurrency(i.total_amount)}</span>
            <Badge variant={i.status === "fully_paid" ? "success" : "warning"}>
              {i.status === "fully_paid" ? "مدفوعة" : "معلّقة"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentsTab({ query: q }: { query: ReturnType<typeof useGetCustomerPaymentsQuery> }) {
  if (q.isLoading) return <TabSkeleton />;
  if (q.isError) return <TabError onRetry={() => q.refetch()} isRetrying={q.isFetching} />;
  const payments = q.data?.data?.payments ?? [];
  if (payments.length === 0) return <TabEmpty label="ما في دفعات مسجّلة." />;

  return (
    <div className="mt-4 space-y-2">
      {payments.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
        >
          <span className="font-mono text-[11px] text-muted-foreground">
            {new Date(p.date).toLocaleDateString("ar-SY")}
          </span>
          <span className="font-mono text-xs font-bold text-success">
            +{formatCurrency(p.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReturnsTab({ query: q }: { query: ReturnType<typeof useGetCustomerReturnInvoicesQuery> }) {
  if (q.isLoading) return <TabSkeleton />;
  if (q.isError) return <TabError onRetry={() => q.refetch()} isRetrying={q.isFetching} />;
  const returns = q.data?.data?.return_invoices ?? [];
  if (returns.length === 0) return <TabEmpty label="ما في مرتجعات." />;

  return (
    <div className="mt-4 space-y-2">
      {returns.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
        >
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] font-bold">{r.number}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              مرتبط بـ {r.sales_invoice_number}
            </p>
          </div>
          <span className="font-mono text-[11px] font-bold text-destructive">
            -{formatCurrency(r.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

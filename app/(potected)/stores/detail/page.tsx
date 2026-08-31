"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/tredro/error-state";
import {
  StoreDetailHeader,
  StoreIdentityCard,
  StoreLocationBanner,
  StoreFinancialSummary,
  StoreWhatsappButton,
  StoreDetailTabs,
  RequestsTab,
  InvoicesTab,
  PaymentsTab,
  ReturnsTab,
  type StoreDetailTab,
} from "@/module/stores/components/detail";
import {
  useGetCustomerByIdQuery,
  useGetCustomerPaymentsQuery,
  useGetCustomerRequestsQuery,
  useGetCustomerReturnInvoicesQuery,
  useGetCustomerSalesInvoicesQuery,
} from "@/module/customers/hooks";
import { getCustomerWorkDays } from "@/module/customers/lib/utils";

export default function StoreDetailPage() {
  return (
    <Suspense fallback={<div />}>
      <StoreDetailContent />
    </Suspense>
  );
}

function StoreDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const customerId = id ? Number(id) : null;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetCustomerByIdQuery(customerId);
  const customer = data?.data?.customer;

  const [tab, setTab] = useState<StoreDetailTab>("requests");

  const requestsQuery = useGetCustomerRequestsQuery(customerId);
  const invoicesQuery = useGetCustomerSalesInvoicesQuery(customerId);
  const paymentsQuery = useGetCustomerPaymentsQuery(customerId);
  const returnsQuery = useGetCustomerReturnInvoicesQuery(customerId);

  const goBack = () => router.push("/stores");

  if (!customerId) {
    return (
      <>
        <StoreDetailHeader title="تفاصيل المحل" onBack={goBack} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          لم يتم تحديد محل صالح لعرض تفاصيله.
        </p>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <StoreDetailHeader title="تفاصيل المحل" onBack={goBack} />
        <ErrorState
          error={error}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </>
    );
  }

  if (!isLoading && !customer) {
    return (
      <>
        <StoreDetailHeader title="تفاصيل المحل" onBack={goBack} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          هذا المحل غير موجود أو غير معيّن لك.
        </p>
      </>
    );
  }

  return (
    <>
      {!isLoading &&
        customer &&
        customer.latitude == null &&
        customer.longitude == null && (
          <StoreLocationBanner customerId={customerId} />
        )}
      <StoreDetailHeader
        title={customer?.name}
        isLoading={isLoading}
        workDays={customer ? getCustomerWorkDays(customer) : []}
        customerId={customerId}
        onBack={goBack}
      />

      <StoreFinancialSummary customer={customer} isLoading={isLoading} />

      {!isLoading && customer && <StoreWhatsappButton phone={customer.phone} />}

      <StoreDetailTabs value={tab} onChange={setTab} />

      {tab === "requests" && <RequestsTab query={requestsQuery} />}
      {tab === "invoices" && (
        <InvoicesTab query={invoicesQuery} customerId={customerId} />
      )}
      {tab === "payments" && <PaymentsTab query={paymentsQuery} />}
      {tab === "returns" && <ReturnsTab query={returnsQuery} />}
    </>
  );
}

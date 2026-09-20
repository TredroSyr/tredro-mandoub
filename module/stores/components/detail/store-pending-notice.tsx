"use client";

import { PendingSyncNotice } from "@/components/tredro/pending-sync";
import { usePendingCustomerChanges } from "@/hooks/use-pending-sync";

/** Invoices and edits saved offline for this store — the figures and lists below don't include them yet. */
export function StorePendingNotice({ customerId }: { customerId: number | null }) {
  const items = usePendingCustomerChanges(customerId);
  return (
    <PendingSyncNotice
      items={items}
      title="بانتظار المزامنة لهذا المحل"
      note="تم حفظها على جهازك — الأرصدة والقوائم أدناه لا تشملها بعد، وستُرسل تلقائيًا عند توفر الاتصال."
      className="mt-3"
    />
  );
}

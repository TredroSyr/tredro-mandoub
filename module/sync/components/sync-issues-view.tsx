"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { toast } from "@/components/ui/toast";
import { useOutboxSummary } from "@/hooks/use-outbox-summary";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { removeOutboxItem, type OutboxItem } from "@/lib/db/outbox";
import { retryOutboxItem } from "@/lib/sync/flush-outbox";

function StatusBadge({ status }: { status: OutboxItem["status"] }) {
  if (status === "failed") {
    return <Badge variant="destructive">تعذّرت المزامنة</Badge>;
  }
  if (status === "syncing") {
    return <Badge variant="warning">جارٍ الإرسال...</Badge>;
  }
  return <Badge variant="warning">بانتظار الاتصال</Badge>;
}

export function SyncIssuesView() {
  const router = useRouter();
  const { connected } = useNetworkStatus();
  const { items, refresh } = useOutboxSummary();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [discardTarget, setDiscardTarget] = useState<OutboxItem | null>(null);

  const handleRetry = async (item: OutboxItem) => {
    setRetryingId(item.id);
    try {
      await retryOutboxItem(item.id);
      refresh();
    } finally {
      setRetryingId(null);
    }
  };

  const handleDiscard = async () => {
    if (!discardTarget) return;
    await removeOutboxItem(discardTarget.id);
    toast.success("تم تجاهل العنصر");
    setDiscardTarget(null);
    refresh();
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="رجوع"
          className="grid size-9 shrink-0 place-items-center rounded-2xl bg-secondary text-primary active:scale-95"
        >
          <IconRenderer name="arrow_right_outlined" className="size-4" />
        </button>
        <h1 className="text-base font-extrabold">عناصر بانتظار المزامنة</h1>
      </div>

      {!connected && (
        <div className="rounded-2xl bg-warning/10 px-3 py-2 text-xs font-bold text-warning-foreground">
          لا يوجد اتصال بالإنترنت الآن — سيتم إعادة المحاولة تلقائيًا عند عودته
        </div>
      )}

      {items.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          <IconRenderer name="refresh_outlined" className="size-6" />
          كل شيء تمت مزامنته — لا توجد عناصر معلّقة
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold">{item.label}</p>
                <StatusBadge status={item.status} />
              </div>

              {item.status === "failed" && item.errorMessage && (
                <p className="text-xs text-destructive">{item.errorMessage}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!connected || retryingId === item.id}
                  onClick={() => handleRetry(item)}
                >
                  {retryingId === item.id ? "جارٍ المحاولة..." : "إعادة المحاولة"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setDiscardTarget(item)}
                >
                  تجاهل
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!discardTarget}
        onOpenChange={(open) => !open && setDiscardTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تجاهل هذا العنصر؟</DialogTitle>
            <DialogDescription>
              لن تتم مزامنته أبدًا — إن كان يمثّل فاتورة أو دفعة حقيقية، ستحتاج
              لإدخالها يدويًا لاحقًا.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDiscardTarget(null)}
            >
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={handleDiscard}>
              تجاهل نهائيًا
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

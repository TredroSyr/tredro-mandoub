"use client";

import { useEffect, useState } from "react";
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
import { formatAgo, readSyncLog, type SyncLogEntry } from "@/lib/sync/sync-log";
import { hasOutboxEditor, OutboxItemEditor } from "./outbox-item-editor";

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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [discardTarget, setDiscardTarget] = useState<OutboxItem | null>(null);
  const [editing, setEditing] = useState<OutboxItem | null>(null);

  // Read after mount (not in the initial state) so the prerendered page and
  // the first client render agree.
  const [history, setHistory] = useState<SyncLogEntry[]>([]);
  useEffect(() => {
    const load = () => setHistory(readSyncLog().reverse().slice(0, 10));
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  /** Sends the item again exactly as saved (a rejected item goes out under a fresh key). */
  const resend = async (item: OutboxItem) => {
    setBusyId(item.id);
    try {
      await retryOutboxItem(item.id);
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  /** Failed item: open the original form pre-filled (edit or just confirm); items with no form resend directly. */
  const handleRetry = (item: OutboxItem) => {
    if (hasOutboxEditor(item)) setEditing(item);
    else void resend(item);
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
          {items.map((item) => {
            const editable = hasOutboxEditor(item);
            const failed = item.status === "failed";
            const busy = busyId === item.id;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold">{item.label}</p>
                  <StatusBadge status={item.status} />
                </div>

                {failed && item.errorMessage && (
                  <p className="text-xs text-destructive">{item.errorMessage}</p>
                )}

                {failed && editable && (
                  <p className="text-[11px] text-muted-foreground">
                    ستُفتح البيانات المحفوظة — عدّلها إن أردت ثم أعد الإرسال.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {failed ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      // Opening the form works offline too (submitting re-queues it);
                      // only a direct resend needs a connection.
                      disabled={busy || (!editable && !connected)}
                      onClick={() => handleRetry(item)}
                    >
                      {busy ? "جارٍ المحاولة..." : "إعادة المحاولة"}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!connected || busy}
                        onClick={() => void resend(item)}
                      >
                        {busy ? "جارٍ الإرسال..." : "مزامنة الآن"}
                      </Button>
                      {editable && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditing(item)}
                        >
                          تعديل
                        </Button>
                      )}
                    </>
                  )}
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
            );
          })}
        </ul>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-extrabold text-muted-foreground">آخر ما تمت مزامنته</h2>
          <ul className="flex flex-col gap-1.5">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <IconRenderer name="tick_outlined" className="size-3.5 text-success-foreground" />
                  {entry.label}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatAgo(entry.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <OutboxItemEditor
          key={editing.id}
          item={editing}
          onClose={() => {
            setEditing(null);
            refresh();
          }}
        />
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

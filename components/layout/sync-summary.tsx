"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Network } from "@capacitor/network";
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
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useOutboxSummary } from "@/hooks/use-outbox-summary";
import { listOutboxItems } from "@/lib/db/outbox";
import { isNativeApp } from "@/lib/native";
import { flushOutbox } from "@/lib/sync/flush-outbox";
import {
  acknowledgeSyncLog,
  formatAgo,
  setSummaryBusy,
  unseenSynced,
  type SyncLogEntry,
} from "@/lib/sync/sync-log";

// How long the launch waits for the first sync attempt before showing the
// summary anyway (a hung connection must not delay the screen; the summary
// keeps updating live once it's open).
const FIRST_SYNC_WAIT_MS = 8000;

// The summary belongs to the app launch, not to a screen: don't repeat it
// when the layout re-mounts during the same session.
let launchHandled = false;

function Section({
  icon,
  tone,
  title,
  children,
}: {
  icon: "tick_outlined" | "refresh_outlined" | "warning_outlined";
  tone: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className={`flex items-center gap-1.5 text-xs font-extrabold ${tone}`}>
        <IconRenderer name={icon} className="size-3.5" />
        {title}
      </h3>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </section>
  );
}

function SummaryBody() {
  const { connected } = useNetworkStatus();
  const { items } = useOutboxSummary(2000);
  const [synced, setSynced] = useState<SyncLogEntry[]>(() => unseenSynced());

  useEffect(() => {
    const timer = setInterval(() => setSynced(unseenSynced()), 2000);
    return () => clearInterval(timer);
  }, []);

  const failed = items.filter((i) => i.status === "failed");
  const waiting = items.filter((i) => i.status !== "failed");

  return (
    <div className="flex max-h-[55dvh] flex-col gap-4 overflow-y-auto">
      {synced.length > 0 && (
        <Section
          icon="tick_outlined"
          tone="text-success-foreground"
          title={`تمت مزامنته (${synced.length})`}
        >
          {[...synced].reverse().map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs">
              <span className="font-bold">{entry.label}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{formatAgo(entry.at)}</span>
            </li>
          ))}
        </Section>
      )}

      {waiting.length > 0 && (
        <Section
          icon="refresh_outlined"
          tone="text-warning-foreground"
          title={`بانتظار الإرسال (${waiting.length})`}
        >
          {waiting.map((item) => (
            <li key={item.id} className="rounded-xl bg-muted/50 px-3 py-2 text-xs font-bold">
              {item.label}
              {item.status === "syncing" && (
                <span className="ms-2 text-[10px] font-normal text-muted-foreground">جارٍ الإرسال…</span>
              )}
            </li>
          ))}
          <p className="text-[11px] text-muted-foreground">
            {connected
              ? "ستُرسل تلقائيًا خلال لحظات."
              : "لا يوجد اتصال بالإنترنت — ستُرسل تلقائيًا عند عودته وأنت داخل التطبيق."}
          </p>
        </Section>
      )}

      {failed.length > 0 && (
        <Section
          icon="warning_outlined"
          tone="text-destructive"
          title={`تعذّرت مزامنته (${failed.length})`}
        >
          {failed.map((item) => (
            <li key={item.id} className="rounded-xl bg-destructive/10 px-3 py-2 text-xs">
              <p className="font-bold">{item.label}</p>
              {item.errorMessage && (
                <p className="mt-0.5 text-[11px] text-destructive">{item.errorMessage}</p>
              )}
            </li>
          ))}
        </Section>
      )}

      {synced.length === 0 && waiting.length === 0 && failed.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">كل شيء تمت مزامنته.</p>
      )}
    </div>
  );
}

/**
 * On app launch, tells the rep what was synced while they were away and what
 * is still waiting or stuck. Native app only. Nothing syncs while the app is
 * closed, so this reports the sync that just ran at launch plus anything
 * synced earlier that they haven't been told about yet.
 */
export function SyncSummary() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isNativeApp() || launchHandled) return;
    launchHandled = true;
    setSummaryBusy(true);

    void (async () => {
      let willOpen = false;
      try {
        const before = await listOutboxItems();
        if (before.length === 0 && unseenSynced().length === 0) return;

        const status = await Network.getStatus().catch(() => ({ connected: true }));
        if (status.connected && before.some((i) => i.status !== "failed")) {
          await Promise.race([
            flushOutbox(),
            new Promise((resolve) => setTimeout(resolve, FIRST_SYNC_WAIT_MS)),
          ]);
        }

        const after = await listOutboxItems();
        if (after.length === 0 && unseenSynced().length === 0) return;
        willOpen = true;
        setOpen(true);
      } catch (error) {
        console.error("[offline] launch sync summary failed", error);
      } finally {
        // With no dialog there is nothing to wait for; otherwise the dialog
        // clears this flag when it is dismissed.
        if (!willOpen) setSummaryBusy(false);
      }
    })();
  }, []);

  const dismiss = (goToItems: boolean) => {
    acknowledgeSyncLog();
    setSummaryBusy(false);
    setOpen(false);
    if (goToItems) router.push("/sync-issues");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss(false)}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>ملخص المزامنة</DialogTitle>
          <DialogDescription>
            هذا ما تمت مزامنته وما لا يزال معلّقًا منذ آخر مرة فتحت فيها التطبيق.
          </DialogDescription>
        </DialogHeader>

        {open && <SummaryBody />}

        <DialogFooter>{open && <SummaryActions onDismiss={dismiss} />}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function SummaryActions({ onDismiss }: { onDismiss: (goToItems: boolean) => void }) {
  const { items } = useOutboxSummary(2000);
  return (
    <>
      {items.length > 0 && (
        <Button type="button" variant="secondary" onClick={() => onDismiss(true)}>
          مراجعة العناصر
        </Button>
      )}
      <Button type="button" onClick={() => onDismiss(false)}>
        حسنًا
      </Button>
    </>
  );
}

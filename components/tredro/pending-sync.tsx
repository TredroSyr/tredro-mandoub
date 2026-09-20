"use client";

import Link from "next/link";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { describeAction, usePendingOfKinds } from "@/hooks/use-pending-sync";
import type { OutboxItem } from "@/lib/db/outbox";
import { cn } from "@/lib/utils";

/**
 * Small tag shown on a card in place of its action buttons: the rep already
 * did the action offline, so it must not look — or be — tappable again.
 */
export function PendingSyncChip({
  item,
  className,
}: {
  item: OutboxItem;
  className?: string;
}) {
  const action = describeAction(item.kind);

  if (item.status === "failed") {
    return (
      <Link
        href="/sync-issues"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex items-center gap-1 rounded-xl bg-destructive/12 px-3 py-2 text-[11px] font-bold text-destructive",
          className,
        )}
      >
        <IconRenderer name="warning_outlined" className="size-3.5" />
        تعذّرت مزامنة {action} — راجعها
      </Link>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-xl bg-warning/15 px-3 py-2 text-[11px] font-bold text-warning-foreground",
        className,
      )}
    >
      <IconRenderer
        name="refresh_outlined"
        className={cn("size-3.5", item.status === "syncing" && "animate-spin")}
      />
      {action} — بانتظار المزامنة
    </span>
  );
}

/**
 * A strip listing what is queued for this screen: it was saved on the device
 * and will be sent automatically, so the rep knows the numbers/lists they are
 * looking at don't include it yet.
 */
export function PendingSyncNotice({
  items,
  title = "بانتظار المزامنة",
  note,
  className,
}: {
  items: OutboxItem[];
  title?: string;
  note?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  const hasFailed = items.some((i) => i.status === "failed");

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl p-3 text-xs",
        hasFailed ? "bg-destructive/10" : "bg-warning/10",
        className,
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1.5 font-extrabold",
          hasFailed ? "text-destructive" : "text-warning-foreground",
        )}
      >
        <IconRenderer name={hasFailed ? "warning_outlined" : "refresh_outlined"} className="size-3.5" />
        {title} ({items.length})
      </p>

      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2">
            <span className="font-bold">{item.label}</span>
            <span
              className={cn(
                "shrink-0 text-[10px]",
                item.status === "failed" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {item.status === "failed"
                ? "تعذّرت المزامنة"
                : item.status === "syncing"
                  ? "جارٍ الإرسال…"
                  : "بانتظار الاتصال"}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-muted-foreground">
        {note ?? "تم حفظها على جهازك وستُرسل تلقائيًا عند توفر الاتصال."}
      </p>

      <Link
        href="/sync-issues"
        className="self-start text-[11px] font-bold text-primary underline-offset-2 hover:underline"
      >
        عرض عناصر المزامنة
      </Link>
    </div>
  );
}

/** Same strip for a list screen: everything of the given kinds that is waiting. */
export function PendingSyncList({
  kinds,
  title,
  note,
  className,
}: {
  kinds: string[];
  title?: string;
  note?: string;
  className?: string;
}) {
  const items = usePendingOfKinds(kinds);
  return <PendingSyncNotice items={items} title={title} note={note} className={className} />;
}

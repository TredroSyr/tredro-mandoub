"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { formatDate } from "@/lib/format";
import { Notification } from "../types";

const NUMBERING_SYSTEM = { numberingSystem: "latn" } as const;

function formatNotificationTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ar-SY", {
    hour: "2-digit",
    minute: "2-digit",
    ...NUMBERING_SYSTEM,
  });
}

export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <IconRenderer
        name="notification_outlined"
        className="size-12 text-muted-foreground/50"
      />
      <p className="text-sm text-muted-foreground">ما في إشعارات بعد.</p>
    </div>
  );
}

export function NotificationList({
  notifications,
  onItemClick,
}: {
  notifications: Notification[];
  onItemClick: (notification: Notification) => void;
}) {
  if (notifications.length === 0) return <NotificationEmptyState />;

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => onItemClick(n)}
          className={`w-full rounded-2xl border p-4 text-start transition-colors active:scale-[0.99] ${
            n.is_read
              ? "border-border bg-card"
              : "border-primary/30 bg-primary/6"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
              <IconRenderer name="notification_filled" className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{n.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{n.body}</p>
              <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                {formatDate(n.created_at)} · {formatNotificationTime(n.created_at)}
              </p>
            </div>
            {!n.is_read && (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

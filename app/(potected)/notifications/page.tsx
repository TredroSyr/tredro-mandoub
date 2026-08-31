"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import AppShell from "@/components/layout/app-shell";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useRepTourStore } from "@/store/use-rep-tour-store";

export default function NotificationsPage() {
  const { notifications, markNotificationsRead } = useRepTourStore(
    useShallow((s) => ({
      notifications: s.notifications,
      markNotificationsRead: s.markNotificationsRead,
    })),
  );

  useEffect(() => {
    markNotificationsRead();
  }, [markNotificationsRead]);

  const list = [...notifications].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell title="الإشعارات" subtitle="Notifications">
      <div className="space-y-2">
        {list.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <IconRenderer
              name="notification_outlined"
              className="size-12 text-muted-foreground/50"
            />
            <p className="text-sm text-muted-foreground">ما في إشعارات بعد.</p>
          </div>
        )}
        {list.map((n) => (
          <article
            key={n.id}
            className={`rounded-2xl border p-4 ${
              n.read ? "border-border bg-card" : "border-primary/30 bg-primary/6"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <IconRenderer name="notification_filled" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{n.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{n.body}</p>
                <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">{n.date}</p>
              </div>
              {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

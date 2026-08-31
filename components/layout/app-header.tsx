"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useRepTourStore } from "@/store/use-rep-tour-store";
import { formatNum } from "@/lib/rep-tour-data";

export default function AppHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const unread = useRepTourStore((s) => s.notifications.filter((n) => !n.read).length);

  return (
    <header className="sticky top-0 z-30 border-b border-glass-border bg-glass px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <Link
          href="/notifications"
          aria-label="الإشعارات"
          className="relative order-3 grid size-9 shrink-0 place-items-center rounded-2xl bg-secondary text-primary active:scale-95"
        >
          <IconRenderer
            name={unread > 0 ? "notification_new_outlined" : "notification_outlined"}
            className="size-4"
          />
          {unread > 0 && (
            <span className="absolute -top-1 -end-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 font-mono text-[9px] font-bold text-destructive-foreground">
              {formatNum(unread)}
            </span>
          )}
        </Link>

        <div className="order-2 min-w-0 flex-1">
          {subtitle && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
              {subtitle}
            </p>
          )}
          <h1 className="truncate text-lg font-extrabold">{title}</h1>
        </div>

        {action && <div className="order-2 shrink-0">{action}</div>}

        <div className="order-1 flex shrink-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <IconRenderer name="logo_filled" className="size-5" />
          </span>
        </div>
      </div>
    </header>
  );
}

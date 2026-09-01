"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useRepTourStore } from "@/store/use-rep-tour-store";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { formatNum } from "@/lib/rep-tour-data";
import { NotificationsDrawer } from "@/components/layout/notifications-drawer";

export default function AppHeader() {
  const unread = useRepTourStore(
    (s) => s.notifications.filter((n) => !n.read).length,
  );
  const rep = useAuthStore((s) => s.rep);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const companyLogo = rep?.company?.logo;

  return (
    <header className="sticky top-0 z-30 border-b border-glass-border bg-glass px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="الإشعارات"
            className="relative grid size-9 shrink-0 place-items-center rounded-2xl bg-secondary text-primary active:scale-95"
          >
            <IconRenderer
              name={
                unread > 0
                  ? "notification_new_outlined"
                  : "notification_outlined"
              }
              className="size-4"
            />
            {unread > 0 && (
              <span className="absolute -top-1 -end-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 font-mono text-[9px] font-bold text-destructive-foreground">
                {formatNum(unread)}
              </span>
            )}
          </button>

          <Link
            href="/settings"
            aria-label="الملف الشخصي"
            className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/12 text-primary active:scale-95"
          >
            {companyLogo && !logoError ? (
              <Image
                src={companyLogo}
                alt="الملف الشخصي"
                width={36}
                height={36}
                className="size-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <IconRenderer name="user_filled" className="size-4" />
            )}
          </Link>
        </div>
        <Image
          src="/tredro/full_logo.svg"
          alt="logo"
          width={140}
          height={70}
          className="h-auto w-[140px] cursor-pointer object-contain transition-all duration-200"
        />
      </div>

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
    </header>
  );
}

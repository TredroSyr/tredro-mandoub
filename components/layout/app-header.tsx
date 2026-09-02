"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useRepTourStore } from "@/store/use-rep-tour-store";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { useThemeStore } from "@/store/use-theme-store";
import { formatNum } from "@/lib/rep-tour-data";
import { NotificationsDrawer } from "@/components/layout/notifications-drawer";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppHeaderProps {
  onRefresh?: () => void;
}

export default function AppHeader({ onRefresh }: AppHeaderProps) {
  const unread = useRepTourStore(
    (s) => s.notifications.filter((n) => !n.read).length,
  );
  const rep = useAuthStore((s) => s.rep);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { theme, toggleTheme } = useThemeStore(
    useShallow((s) => ({
      theme: s.theme,
      toggleTheme: s.toggleTheme,
    })),
  );
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [referralInfoOpen, setReferralInfoOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const companyLogo = rep?.company?.logo;

  const handleLogout = () => {
    setMenuOpen(false);
    clearAuth();
    router.replace("/auth/login");
  };

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

          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger
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
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="group w-72 gap-0 p-0 duration-200"
            >
              <div
                className="flex items-center gap-3 p-3 group-data-open:animate-in group-data-open:fade-in-0 group-data-open:slide-in-from-top-1 group-data-open:duration-300"
                style={{ animationDelay: "0ms" }}
              >
                <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/12 text-primary">
                  {companyLogo && !logoError ? (
                    <Image
                      src={companyLogo}
                      alt="الملف الشخصي"
                      width={44}
                      height={44}
                      className="size-full object-cover"
                    />
                  ) : (
                    <IconRenderer name="user_filled" className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{rep?.name}</p>
                  {rep?.phone && (
                    <p
                      className="font-mono text-[11px] text-muted-foreground"
                      dir="ltr"
                    >
                      {rep.phone}
                    </p>
                  )}
                </div>
              </div>

              {rep?.referral_code && (
                <>
                  <div className="border-t border-border" />
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-2.5 group-data-open:animate-in group-data-open:fade-in-0 group-data-open:slide-in-from-top-1 group-data-open:duration-300"
                    style={{ animationDelay: "40ms" }}
                  >
                    <span className="flex items-center gap-2 text-xs font-bold">
                      <IconRenderer
                        name="tag_outlined"
                        className="size-4 text-primary"
                      />
                      كود الإحالة
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-primary">
                        {rep.referral_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReferralInfoOpen(true)}
                        aria-label="معلومات عن كود الإحالة"
                        className="grid size-5 place-items-center rounded-full text-muted-foreground active:scale-95"
                      >
                        <IconRenderer name="info_outlined" className="size-4" />
                      </button>
                    </span>
                  </div>
                </>
              )}

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold group-data-open:animate-in group-data-open:fade-in-0 group-data-open:slide-in-from-top-1 group-data-open:duration-300"
                style={{ animationDelay: "80ms" }}
              >
                <IconRenderer
                  name="user_filled"
                  className="size-4 text-primary"
                />
                عرض الملف الشخصي
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between px-3 py-2.5 group-data-open:animate-in group-data-open:fade-in-0 group-data-open:slide-in-from-top-1 group-data-open:duration-300"
                style={{ animationDelay: "120ms" }}
              >
                <span className="flex items-center gap-2.5 text-xs font-bold">
                  <IconRenderer
                    name={
                      theme === "dark" ? "moon_filled" : "morning_sun_filled"
                    }
                    className="size-4 text-primary"
                  />
                  الوضع {theme === "dark" ? "الليلي" : "النهاري"}
                </span>
                <span
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    theme === "dark" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-4 rounded-full bg-card shadow transition-all ${
                      theme === "dark" ? "start-0.5" : "end-0.5"
                    }`}
                  />
                </span>
              </button>

              <div className="border-t border-border" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setLogoutDialogOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-destructive group-data-open:animate-in group-data-open:fade-in-0 group-data-open:slide-in-from-top-1 group-data-open:duration-300"
                style={{ animationDelay: "160ms" }}
              >
                <IconRenderer name="logout_outlined" className="size-4" />
                تسجيل الخروج
              </button>
            </PopoverContent>
          </Popover>
        </div>
        <button type="button" onClick={onRefresh}>
          <Image
            src="/tredro/full_logo.svg"
            alt="logo"
            width={140}
            height={70}
            className="h-auto w-[140px] cursor-pointer object-contain transition-all duration-200 hover:scale-105 active:scale-95"
          />
        </button>
      </div>

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />

      <Dialog open={referralInfoOpen} onOpenChange={setReferralInfoOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>كود الإحالة</DialogTitle>
            <DialogDescription>
              شارك هذا الكود مع عملائك الجدد. كل عملية تسجيل أو شراء تتم
              باستخدامه تُحتسب ضمن إحالاتك وتظهر في التحليلات الخاصة بك.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReferralInfoOpen(false)}
            >
              حسناً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تسجيل الخروج</DialogTitle>
            <DialogDescription>هل أنت متأكد من تسجيل الخروج؟</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLogoutDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={handleLogout}>
              تسجيل الخروج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { useThemeStore } from "@/store/use-theme-store";
import { formatNum } from "@/lib/rep-tour-data";
import {
  useUnreadNotificationsCountQuery,
  useUnregisterNotificationDeviceMutation,
} from "@/module/notifications/hooks";
import { FCM_TOKEN_STORAGE_KEY } from "@/module/notifications/hooks/use-register-push-notifications";
import { useOutboxSummary } from "@/hooks/use-outbox-summary";
import { clearOfflineCache } from "@/lib/db/query-persister";
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
import { useQueryClient } from "@tanstack/react-query";

// Staggered entrance for popover rows; the delay is set per row via style.
const ITEM_ANIMATION =
  "group-data-open:animate-in group-data-open:fade-in-0 group-data-open:slide-in-from-top-2 group-data-open:duration-300 group-data-open:fill-mode-backwards";
const MENU_ITEM =
  "group/item flex items-center rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200 hover:bg-secondary active:scale-[0.97]";
const MENU_ICON =
  "grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary transition-transform duration-200 group-hover/item:rotate-6 group-hover/item:scale-110";

interface AppHeaderProps {
  onRefresh?: () => void;
}

export default function AppHeader({ onRefresh }: AppHeaderProps) {
  const { data: unreadCountData } = useUnreadNotificationsCountQuery();
  const unread = unreadCountData?.data?.unread_count ?? 0;
  const { mutate: unregisterDevice } =
    useUnregisterNotificationDeviceMutation();
  const rep = useAuthStore((s) => s.rep);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { theme, toggleTheme } = useThemeStore(
    useShallow((s) => ({
      theme: s.theme,
      toggleTheme: s.toggleTheme,
    })),
  );
  const router = useRouter();
  const { pendingCount, failedCount } = useOutboxSummary();
  const unsyncedCount = pendingCount + failedCount;
  const [logoError, setLogoError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [referralInfoOpen, setReferralInfoOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const companyLogo = rep?.company?.logo;
  const queryClient = useQueryClient();
  const handleLogout = () => {
    setMenuOpen(false);

    // This device's push token belongs to whoever is signed in on it (backend
    // §4.3) — unregister it now, and clear the dedup cache so the next sign-in
    // (possibly a different rep) always re-registers instead of assuming
    // "same token = already registered".
    const fcmToken = window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    if (fcmToken) {
      unregisterDevice(fcmToken);
      window.localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    }

    clearAuth();
    queryClient.clear();
    void clearOfflineCache();
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-glass-border bg-glass px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] backdrop-blur-2xl">
      <div
        className="mx-auto flex max-w-md items-center justify-between gap-3"
        dir="ltr"
      >
        <button
          type="button"
          onClick={() => router.push("/notifications")}
          aria-label="الإشعارات"
          className="relative grid size-9 shrink-0 place-items-center rounded-2xl bg-secondary text-primary active:scale-95"
        >
          <IconRenderer
            name={
              unread > 0 ? "notification_new_outlined" : "notification_outlined"
            }
            className="size-4"
          />
          {unread > 0 && (
            <span className="absolute -top-1 -end-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 font-mono text-white text-[9px] font-bold ">
              {formatNum(unread)}
            </span>
          )}
        </button>

        {unsyncedCount > 0 && (
          <button
            type="button"
            onClick={() => router.push("/sync-issues")}
            aria-label="عناصر بانتظار المزامنة"
            className="relative grid size-9 shrink-0 place-items-center rounded-2xl bg-secondary text-primary active:scale-95"
          >
            <IconRenderer name="refresh_outlined" className="size-4" />
            <span
              className={`absolute -top-1 -end-1 grid min-w-4 place-items-center rounded-full px-1 font-mono text-white text-[9px] font-bold ${
                failedCount > 0 ? "bg-destructive" : "bg-warning"
              }`}
            >
              {formatNum(unsyncedCount)}
            </span>
          </button>
        )}

        <button type="button" onClick={onRefresh} className="shrink-0">
          <Image
            src="/tredro/full_logo.svg"
            alt="logo"
            width={140}
            height={70}
            className="h-auto w-[140px] cursor-pointer object-contain transition-all duration-200 hover:scale-105 active:scale-95"
          />
        </button>

        <div className="flex shrink-0 items-center" dir="rtl">
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
              sideOffset={10}
              className="group w-80 gap-0 overflow-hidden rounded-3xl p-0 shadow-xl duration-300 data-open:zoom-in-90 data-open:slide-in-from-top-4 data-closed:zoom-out-90"
            >
              <div
                className={`flex items-center gap-4 bg-primary/8 p-4 ${ITEM_ANIMATION}`}
                style={{ animationDelay: "0ms" }}
              >
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/12 text-primary ring-2 ring-primary/20 group-data-open:animate-in group-data-open:zoom-in-50 group-data-open:duration-500">
                  {companyLogo && !logoError ? (
                    <Image
                      src={companyLogo}
                      alt="الملف الشخصي"
                      width={56}
                      height={56}
                      className="size-full object-cover"
                    />
                  ) : (
                    <IconRenderer name="user_filled" className="size-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold">
                    {rep?.name}
                  </p>
                  {rep?.phone && (
                    <p
                      className="font-mono text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      {rep.phone}
                    </p>
                  )}
                </div>
              </div>

              {rep?.referral_code && (
                <div
                  className={`flex items-center justify-between gap-3 border-t border-border px-4 py-3.5 ${ITEM_ANIMATION}`}
                  style={{ animationDelay: "60ms" }}
                >
                  <span className="flex items-center gap-3 text-sm font-bold">
                    <IconRenderer
                      name="tag_outlined"
                      className="size-5 text-primary"
                    />
                    كود الإحالة
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">
                      {rep.referral_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReferralInfoOpen(true)}
                      aria-label="معلومات عن كود الإحالة"
                      className="grid size-7 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-primary active:scale-90"
                    >
                      <IconRenderer name="info_outlined" className="size-5" />
                    </button>
                  </span>
                </div>
              )}

              <div className="border-t border-border p-2">
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className={`${MENU_ITEM} ${ITEM_ANIMATION}`}
                  style={{ animationDelay: "120ms" }}
                >
                  <span className="flex items-center gap-3">
                    <span className={MENU_ICON}>
                      <IconRenderer name="user_filled" className="size-5" />
                    </span>
                    عرض إحصائياتي
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`${MENU_ITEM} w-full justify-between ${ITEM_ANIMATION}`}
                  style={{ animationDelay: "180ms" }}
                >
                  <span className="flex items-center gap-3">
                    <span className={MENU_ICON}>
                      <IconRenderer
                        name={
                          theme === "dark" ? "moon_filled" : "morning_sun_filled"
                        }
                        className="size-5"
                      />
                    </span>
                    الوضع {theme === "dark" ? "الليلي" : "النهاري"}
                  </span>
                  <span
                    className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                      theme === "dark" ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 size-4 rounded-full bg-card shadow transition-all duration-300 ${
                        theme === "dark" ? "start-1" : "end-1"
                      }`}
                    />
                  </span>
                </button>

                <div className="mx-2 my-1 border-t border-border" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setLogoutDialogOpen(true);
                  }}
                  className={`${MENU_ITEM} w-full text-destructive hover:bg-destructive/10 ${ITEM_ANIMATION}`}
                  style={{ animationDelay: "240ms" }}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`${MENU_ICON} bg-destructive/10 text-destructive`}
                    >
                      <IconRenderer name="logout_outlined" className="size-5" />
                    </span>
                    تسجيل الخروج
                  </span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

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

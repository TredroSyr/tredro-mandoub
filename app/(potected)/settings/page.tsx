"use client";

import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { useThemeStore } from "@/store/use-theme-store";

export default function SettingsPage() {
  const rep = useAuthStore((s) => s.rep);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { theme, toggleTheme } = useThemeStore(
    useShallow((s) => ({
      theme: s.theme,
      toggleTheme: s.toggleTheme,
    })),
  );
  const router = useRouter();

  return (
    <>
      <section className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/12 text-primary">
          <IconRenderer name="user_filled" className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{rep?.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {rep?.phone}
          </p>
          {rep?.company?.name && (
            <p className="mt-1 truncate text-[11px] text-muted-foreground">{rep.company.name}</p>
          )}
        </div>
      </section>

      {rep?.referral_code && (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="flex items-center gap-3 text-sm font-bold">
            <IconRenderer name="tag_outlined" className="size-4 text-primary" /> كود الإحالة
          </span>
          <span className="font-mono text-xs font-bold text-primary">{rep.referral_code}</span>
        </div>
      )}

      <button
        onClick={toggleTheme}
        className="mt-3 flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4"
      >
        <span className="flex items-center gap-3 text-sm font-bold">
          <IconRenderer
            name={theme === "dark" ? "moon_filled" : "morning_sun_filled"}
            className="size-4 text-primary"
          />
          الوضع {theme === "dark" ? "الليلي" : "النهاري"}
        </span>
        <span
          className={`relative h-6 w-11 rounded-full transition-colors ${
            theme === "dark" ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${
              theme === "dark" ? "start-0.5" : "end-0.5"
            }`}
          />
        </span>
      </button>

      <Button
        variant="destructive"
        onClick={() => {
          clearAuth();
          router.replace("/auth/login");
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold"
      >
        <IconRenderer name="logout_outlined" className="size-4" /> تسجيل الخروج
      </Button>
    </>
  );
}

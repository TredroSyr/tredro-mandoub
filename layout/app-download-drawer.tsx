"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

function isRunningInBrowser() {
  if (typeof window === "undefined") return false;

  if (Capacitor.isNativePlatform()) return false;

  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;

  const isStandaloneDisplay =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches;

  const isTWA = document.referrer?.startsWith("android-app://");

  return !iosStandalone && !isStandaloneDisplay && !isTWA;
}

export default function AppDownloadDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isRunningInBrowser()) return;

    const dismissed = sessionStorage.getItem("app_drawer_dismissed");

    if (dismissed) return;

    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth < 768;

    if (!isMobile) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value && typeof window !== "undefined") {
      sessionStorage.setItem("app_drawer_dismissed", "1");
    }
  };

  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="mx-auto max-w-md rounded-t-3xl rounded-b-3xl border-0 bg-background px-6 pb-8 pt-4 data-[state=open]:duration-500 data-[state=open]:ease-out data-[state=closed]:duration-300">
        <DrawerClose>
          <button
            className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 active:scale-90"
            aria-label="إغلاق"
          >
            <IconRenderer name="close_outlined" className="h-4 w-4" />
          </button>
        </DrawerClose>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-lg ring-1 ring-border animate-in zoom-in-50 fade-in duration-500">
            <span className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping [animation-duration:2s]" />
            <span className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />

            <IconRenderer
              name="download_outlined"
              className="relative h-9 w-9 text-primary animate-bounce [animation-duration:2s]"
            />
          </div>

          <span className="mb-2 text-sm font-medium text-primary animate-in fade-in slide-in-from-bottom-1 duration-500 [animation-delay:100ms] [animation-fill-mode:backwards]">
            Tredro
          </span>

          <h2 className="mb-3 text-2xl font-bold leading-snug text-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:200ms] [animation-fill-mode:backwards]">
            لعروضٍ أفضل وتجربةٍ أمتع
          </h2>

          <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:300ms] [animation-fill-mode:backwards]">
            حمّل التطبيق والحق العروض أولاً — تصفّح أسرع، إشعارات بالخصومات،
            وتتبّع طلبك خطوة بخطوة.
          </p>

          <Button
            size="lg"
            className="group relative mb-4 h-13 w-full overflow-hidden rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 active:scale-95 hover:scale-[1.02] hover:bg-primary/90 animate-in fade-in slide-in-from-bottom-2 [animation-delay:400ms] [animation-fill-mode:backwards]"
          >
            <a
              href="#"
              className="relative z-10 flex items-center justify-center gap-2 text-base font-semibold"
            >
              حمّل التطبيق الآن
              <IconRenderer
                name="download_outlined"
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:animate-bounce"
              />
            </a>

            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent [animation:shine_2.5s_ease-in-out_infinite]" />
          </Button>

          <DrawerClose>
            <button
              onClick={() => handleOpenChange(false)}
              className="text-sm font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline animate-in fade-in duration-500 [animation-delay:500ms] [animation-fill-mode:backwards]"
            >
              ليس الآن، تابع في المتصفح
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>

      <style jsx global>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }

          50% {
            transform: translateX(100%);
          }

          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </Drawer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function AppDownloadDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      return;
    }

    const dismissed = sessionStorage.getItem("app_drawer_dismissed");

    if (dismissed) {
      return;
    }

    const iosStandalone =
      (
        window.navigator as Navigator & {
          standalone?: boolean;
        }
      ).standalone === true;

    const isStandaloneDisplay =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.matchMedia?.("(display-mode: fullscreen)").matches ||
      window.matchMedia?.("(display-mode: minimal-ui)").matches;

    const isTWA = document.referrer?.startsWith("android-app://");

    if (iosStandalone || isStandaloneDisplay || isTWA) {
      return;
    }

    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth < 768;

    if (!isMobile) {
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      sessionStorage.setItem("app_drawer_dismissed", "1");
    }
  };

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

            <Image
              src="/tredro/logo.svg"
              alt="Tredro"
              width={36}
              height={36}
              className="relative h-9 w-9 animate-bounce object-contain [animation-duration:2s]"
            />
          </div>

          <span className="mb-2 text-sm font-medium text-primary">Tredro</span>

          <h2 className="mb-3 text-2xl font-bold leading-snug text-foreground">
            إدارة أسهل لمندوبيك وطلباتك
          </h2>

          <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
            حمّل تطبيق تريدرو وتابع مندوبي المبيعات، الطلبات، والمخزون أينما كنت
            — إشعارات فورية، وتحكّم كامل من جوالك.
          </p>

          <Button
            size="lg"
            className="group relative mb-4 h-13 w-full overflow-hidden rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 active:scale-95 hover:scale-[1.02] hover:bg-primary/90"
          >
            <a
              href="/downloads/tredro-dashborad.apk"
              download
              target="_blank"
              rel="noopener noreferrer"
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
            <button className="text-sm font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline">
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

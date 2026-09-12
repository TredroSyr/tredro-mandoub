"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import api from "@/lib/axios";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const APP_PARAM = "rep";
const APK_URL = "https://mandoub.tredro.online/download/tredro-mandoub.apk";

// Compares two dot-separated version strings (e.g. "1.2.0" vs "1.10.0") part
// by part as numbers instead of lexicographically, so "1.10.0" > "1.2.0".
// Missing/non-numeric parts fail closed (treated as "not newer") so a
// malformed value from the backend never wrongly triggers the update drawer.
function isNewerVersion(remote: string, installed: string): boolean {
  const parse = (v: string) => v.trim().split(".").map((p) => parseInt(p, 10));
  const remoteParts = parse(remote);
  const installedParts = parse(installed);
  const len = Math.max(remoteParts.length, installedParts.length);

  for (let i = 0; i < len; i++) {
    const r = remoteParts[i] ?? 0;
    const inst = installedParts[i] ?? 0;
    if (Number.isNaN(r) || Number.isNaN(inst)) return false;
    if (r > inst) return true;
    if (r < inst) return false;
  }

  return false;
}

export default function UpdateChecker() {
  const [open, setOpen] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    (async () => {
      try {
        const info = await App.getInfo();
        const installedVersion = info.version;

        const { data } = await api.get<{ app: string; version: string }>(
          "/apk-version",
          { params: { app: APP_PARAM } },
        );

        if (cancelled) return;
        if (!isNewerVersion(data.version, installedVersion)) return;

        const dismissKey = `update_dismissed_v${data.version}`;
        if (sessionStorage.getItem(dismissKey)) return;

        setLatestVersion(data.version);
        setOpen(true);
      } catch {
        // Silently no-op — never block app usage on a failed version check.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value && latestVersion != null) {
      sessionStorage.setItem(`update_dismissed_v${latestVersion}`, "1");
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
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-lg ring-1 ring-border">
            <IconRenderer name="refresh_outlined" className="h-9 w-9 text-primary" />
          </div>

          <span className="mb-2 text-sm font-medium text-primary">Tredro</span>

          <h2 className="mb-3 text-2xl font-bold leading-snug text-foreground">
            يتوفر تحديث جديد للتطبيق
          </h2>

          <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
            قم بتحديث التطبيق للحصول على آخر الميزات وأحدث الإصلاحات.
          </p>

          <Button
            size="lg"
            className="group relative mb-4 h-13 w-full overflow-hidden rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 active:scale-95 hover:scale-[1.02] hover:bg-primary/90"
          >
            <a
              href={APK_URL}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 flex items-center justify-center gap-2 text-base font-semibold"
            >
              تحديث الآن
              <IconRenderer name="download_outlined" className="h-5 w-5" />
            </a>
          </Button>

          <DrawerClose>
            <button className="text-sm font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline">
              ليس الآن
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

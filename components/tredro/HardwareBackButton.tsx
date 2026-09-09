"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Wires the Android hardware/gesture back button to in-app navigation.
 *
 * Capacitor's default behaviour without this listener is to fall back to
 * the WebView's own history, which doesn't reliably track Next.js App
 * Router navigations (e.g. list -> detail). We keep our own navigation
 * depth counter so "back" always returns to the previous in-app screen
 * (e.g. store detail -> stores list) and only exits the app once the
 * user is back at the root.
 */
export default function HardwareBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const depthRef = useRef(0);
  const isPopRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    const onPopState = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    if (isPopRef.current) {
      depthRef.current = Math.max(0, depthRef.current - 1);
      isPopRef.current = false;
    } else {
      depthRef.current += 1;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => void } | undefined;

    App.addListener("backButton", () => {
      if (depthRef.current > 0) {
        depthRef.current -= 1;
        router.back();
      } else {
        App.exitApp();
      }
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, [router]);

  return null;
}

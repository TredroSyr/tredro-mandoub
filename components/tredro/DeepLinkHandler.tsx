"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import type { URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const DEEP_LINK_HOST = "mandoub.tredro.online";

function toInAppPath(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== DEEP_LINK_HOST) {
    return null;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
}

export default function DeepLinkHandler() {
  const router = useRouter();
  const hasHandledLaunchUrlRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => void } | undefined;

    const navigateToUrl = (url: string) => {
      const path = toInAppPath(url);
      if (path) router.push(path);
    };

    if (!hasHandledLaunchUrlRef.current) {
      hasHandledLaunchUrlRef.current = true;
      App.getLaunchUrl().then((result) => {
        if (result?.url) navigateToUrl(result.url);
      });
    }

    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      navigateToUrl(event.url);
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, [router]);

  return null;
}

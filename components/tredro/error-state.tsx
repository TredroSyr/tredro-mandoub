"use client";

import type { FetchStatus } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { isNetworkError, useIsOffline } from "@/lib/network-status";

export interface ErrorStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
  /** The underlying query/thrown error, used to tell a lost connection apart from a server error. */
  error?: unknown;
  /** The query's fetchStatus — "paused" means this data has never been downloaded and is waiting on a connection (offlineFirst), which gets its own explainer copy. */
  fetchStatus?: FetchStatus;
  className?: string;
}

/** Global error state: identifies whether the problem is a lost internet connection, a never-loaded offline query, or a server error, and offers a retry. */
export function ErrorState({
  onRetry,
  isRetrying,
  error,
  fetchStatus,
  className,
}: ErrorStateProps) {
  const isOffline = useIsOffline();
  const needsInitialSync = fetchStatus === "paused";
  const isConnectivityIssue = !needsInitialSync && (isOffline || isNetworkError(error));

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className,
      )}
    >
      <IconRenderer
        name={
          needsInitialSync || isConnectivityIssue
            ? "globe_outlined"
            : "warning_outlined"
        }
        className="w-12 h-12 text-destructive/60"
      />
      <p className="text-sm text-muted-foreground">
        {needsInitialSync
          ? "لا يوجد اتصال بالإنترنت حاليًا، ولم يتم تحميل أي بيانات على جهازك بعد. اتصل بالإنترنت مرة واحدة لتحميل البيانات الأساسية، وبعدها سيعمل التطبيق بدون اتصال."
          : isConnectivityIssue
            ? "لا يوجد اتصال بالإنترنت حاليًا. يُرجى التحقق من اتصال الشبكة والمحاولة مرة أخرى."
            : "حدث خطأ أثناء تحميل البيانات. يُرجى المحاولة مرة أخرى."}
      </p>
      <Button size="sm" variant="secondary" onClick={onRetry} disabled={isRetrying}>
        <IconRenderer name="refresh_outlined" className="w-4 h-4" />
        إعادة المحاولة
      </Button>
    </div>
  );
}

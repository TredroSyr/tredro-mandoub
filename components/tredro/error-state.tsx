"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { isNetworkError, useIsOffline } from "@/lib/network-status";

export interface ErrorStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
  /** The underlying query/thrown error, used to tell a lost connection apart from a server error. */
  error?: unknown;
  className?: string;
}

/** Global error state: identifies whether the problem is a lost internet connection or a server error, and offers a retry. */
export function ErrorState({ onRetry, isRetrying, error, className }: ErrorStateProps) {
  const isOffline = useIsOffline();
  const isConnectivityIssue = isOffline || isNetworkError(error);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className,
      )}
    >
      <IconRenderer
        name={isConnectivityIssue ? "globe_outlined" : "warning_outlined"}
        className="w-12 h-12 text-destructive/60"
      />
      <p className="text-sm text-muted-foreground">
        {isConnectivityIssue
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

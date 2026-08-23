"use client";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="w-full rounded-2xl border border-border bg-background/60 p-3.5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="text-center p-2 rounded-xl bg-primary/8">
      <Skeleton className="h-8 w-8 mx-auto rounded-full" />
      <Skeleton className="h-3 w-12 mx-auto mt-1" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonStat };

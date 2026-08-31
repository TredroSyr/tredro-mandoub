import { Skeleton } from "@/components/ui/skeleton";

export interface StoresStatsProps {
  total: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
}

export function StoresStats({
  total,
  activeCount,
  inactiveCount,
  isLoading,
}: StoresStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl bg-primary/8 p-2 text-center">
        {isLoading ? (
          <Skeleton className="mx-auto h-7 w-8" />
        ) : (
          <p className="text-2xl font-bold text-primary">{total}</p>
        )}
        <p className="text-[10px] text-muted-foreground">إجمالي</p>
      </div>
      <div className="rounded-2xl bg-success/8 p-2 text-center">
        {isLoading ? (
          <Skeleton className="mx-auto h-7 w-8" />
        ) : (
          <p className="text-2xl font-bold text-success">{activeCount}</p>
        )}
        <p className="text-[10px] text-muted-foreground">نشط</p>
      </div>
      <div className="rounded-2xl bg-muted p-2 text-center">
        {isLoading ? (
          <Skeleton className="mx-auto h-7 w-8" />
        ) : (
          <p className="text-2xl font-bold text-muted-foreground">
            {inactiveCount}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">غير نشط</p>
      </div>
    </div>
  );
}

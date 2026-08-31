"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { WORK_DAYS_API } from "@/module/customers/schema";
import { WORK_DAYS_LABELS } from "@/module/customers/lib/utils";
import { useUpdateCustomerMutation } from "@/module/customers/hooks";

const VISIBLE_DAYS = 2;

export interface StoreDetailHeaderProps {
  title?: string;
  isLoading?: boolean;
  workDays?: string[];
  customerId?: number;
  onBack: () => void;
}

export function StoreDetailHeader({
  title,
  isLoading,
  workDays = [],
  customerId,
  onBack,
}: StoreDetailHeaderProps) {
  const [open, setOpen] = useState(false);
  const visibleDays = workDays.slice(0, VISIBLE_DAYS);
  const extraCount = workDays.length - visibleDays.length;

  return (
    <div className="mt-3 flex items-center gap-2">
      <Button variant="secondary" size="icon" onClick={onBack} aria-label="العودة إلى قائمة المحلات">
        <IconRenderer name="arrow_right_outlined" className="w-4 h-4" />
      </Button>

      {isLoading ? (
        <Skeleton className="h-5 w-32" />
      ) : (
        <h1 className="min-w-0 flex-1 truncate text-base font-extrabold leading-tight">{title}</h1>
      )}

      {!isLoading && customerId != null && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border py-0.5 ps-1.5 pe-1"
          aria-label="تعديل أيام الزيارة"
        >
          {workDays.length === 0 ? (
            <Badge variant="outline" className="border-none text-[10px]">
              <IconRenderer name="calendar_outlined" className="w-3.5 h-3.5" />
              إضافة أيام
            </Badge>
          ) : (
            <>
              {visibleDays.map((day) => (
                <Badge key={day} className="text-[10px]">
                  {WORK_DAYS_LABELS[day] ?? day}
                </Badge>
              ))}
              {extraCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{extraCount}
                </Badge>
              )}
            </>
          )}
          <IconRenderer name="edit_outlined" className="w-3 h-3 text-muted-foreground" />
        </button>
      )}

      {customerId != null && (
        <WorkDaysDialog
          key={String(open)}
          open={open}
          onOpenChange={setOpen}
          customerId={customerId}
          workDays={workDays}
        />
      )}
    </div>
  );
}

function WorkDaysDialog({
  open,
  onOpenChange,
  customerId,
  workDays,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  workDays: string[];
}) {
  const [selected, setSelected] = useState<string[]>(workDays);
  const updateCustomerMutation = useUpdateCustomerMutation({
    onSuccess: () => onOpenChange(false),
  });

  const toggleDay = (day: string) => {
    setSelected((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>أيام زيارة هذا المحل</DialogTitle>
        </DialogHeader>

        {workDays.length === 0 && (
          <p className="text-xs text-muted-foreground">
            لا توجد أيام زيارة محددة لهذا المحل بعد. يمكنك إضافتها الآن.
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {WORK_DAYS_API.map((day) => (
            <Button
              key={day}
              type="button"
              size="sm"
              variant={selected.includes(day) ? "default" : "secondary"}
              className="rounded-xl"
              onClick={() => toggleDay(day)}
            >
              {WORK_DAYS_LABELS[day] ?? day}
            </Button>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={() => updateCustomerMutation.mutate({ customerId, data: { work_days: selected } })}
            disabled={updateCustomerMutation.isPending}
          >
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

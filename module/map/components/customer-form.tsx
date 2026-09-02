"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/tredro/phone-input";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  createCustomerSchema,
  CreateCustomerValues,
  WORK_DAYS_API,
  WORK_DAYS_LABELS,
} from "@/module/customers/schema";
import { useCreateCustomerMutation, useUpdateCustomerMutation } from "@/module/customers/hooks";
import { UpdateCustomerRequest } from "@/module/customers/types";
import type { Customer } from "@/module/customers/types";
import { ApiErrorResponse } from "@/module/auth/types";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CustomerFormProps {
  /** When provided, the form edits this customer instead of creating a new one. */
  customer?: Customer;
  pickedPoint: [number, number] | null;
  onPickLocation: () => void;
  onUseMyLocation: () => void;
  isLoadingLocation: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CustomerForm({
  customer,
  pickedPoint,
  onPickLocation,
  onUseMyLocation,
  isLoadingLocation,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const rep = useAuthStore((state) => state.rep);
  const isEdit = !!customer;

  const form = useForm<CreateCustomerValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      address: customer?.address ?? "",
      work_days: customer?.work_days?.length
        ? (customer.work_days as any)
        : rep?.work_days?.length
          ? (rep.work_days as any)
          : undefined,
      latitude: pickedPoint?.[0],
      longitude: pickedPoint?.[1],
    },
  });

  useEffect(() => {
    if (pickedPoint) {
      form.setValue("latitude", pickedPoint[0]);
      form.setValue("longitude", pickedPoint[1]);
    } else {
      form.setValue("latitude", undefined);
      form.setValue("longitude", undefined);
    }
  }, [pickedPoint, form]);

  const createCustomerMutation = useCreateCustomerMutation({
    onSuccess: () => {
      form.reset();
      onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.entries(errors).forEach(([field, messages]) => {
          const fieldMap: Record<string, keyof CreateCustomerValues> = {
            name: "name",
            phone: "phone",
            email: "email",
            work_days: "work_days",
            latitude: "latitude",
            location: "latitude",
          };
          const mapped = fieldMap[field];
          if (mapped) {
            form.setError(mapped, { message: messages[0] });
          }
        });
      }
    },
  });

  // The update endpoint only accepts address/location/work_days — name, phone
  // and email can't be changed once the customer exists.
  const updateCustomerMutation = useUpdateCustomerMutation({
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.entries(errors).forEach(([field, messages]) => {
          const fieldMap: Record<string, keyof CreateCustomerValues> = {
            address: "address",
            work_days: "work_days",
            latitude: "latitude",
            location: "latitude",
          };
          const mapped = fieldMap[field];
          if (mapped) {
            form.setError(mapped, { message: messages[0] });
          }
        });
      }
    },
  });

  const isPending = isEdit ? updateCustomerMutation.isPending : createCustomerMutation.isPending;

  const onSubmit = (values: CreateCustomerValues) => {
    if (isEdit && customer) {
      const requestData: UpdateCustomerRequest = {
        address: values.address?.trim() ?? "",
      };
      if (values.latitude !== undefined && values.longitude !== undefined) {
        requestData.latitude = Number(values.latitude.toFixed(6));
        requestData.longitude = Number(values.longitude.toFixed(6));
      }
      if (values.work_days && values.work_days.length > 0) {
        requestData.work_days = values.work_days;
      }
      updateCustomerMutation.mutate({ customerId: customer.id, data: requestData });
      return;
    }

    const requestData: any = {
      name: values.name.trim(),
      phone: values.phone,
    };

    if (values.email?.trim()) {
      requestData.email = values.email.trim();
    }
    if (values.address?.trim()) {
      requestData.address = values.address.trim();
    }
    if (values.latitude !== undefined && values.longitude !== undefined) {
      // Round to 6 decimal places (max 9 digits total) to avoid API precision errors
      requestData.latitude = Number(values.latitude.toFixed(6));
      requestData.longitude = Number(values.longitude.toFixed(6));
    }
    if (values.work_days && values.work_days.length > 0) {
      requestData.work_days = values.work_days;
    }

    createCustomerMutation.mutate(requestData);
  };

  const toggleWorkDay = (day: typeof WORK_DAYS_API[number]) => {
    const current = form.getValues("work_days") || [];
    const newDays = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    form.setValue("work_days", newDays as any, { shouldValidate: true });
  };

  const selectedWorkDays = form.watch("work_days") || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold text-primary">
                اسم العميل
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="مثال: أحمد محمد"
                  disabled={isEdit}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              {isEdit ? (
                <p className="text-[10px] text-muted-foreground">
                  لا يمكن تعديل اسم العميل ورقم الهاتف والبريد الإلكتروني
                </p>
              ) : (
                <FormMessage className="text-[11px] font-bold" />
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) =>
            isEdit ? (
              <FormItem>
                <FormLabel className="text-[11px] font-bold text-primary">
                  رقم الهاتف
                </FormLabel>
                <FormControl>
                  <PhoneInput value={field.value || ""} readOnly />
                </FormControl>
              </FormItem>
            ) : (
              <FormItem>
                <FormLabel className="text-[11px] font-bold text-primary">
                  رقم الهاتف
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage className="text-[11px] font-bold" />
              </FormItem>
            )
          }
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold text-primary">
                البريد الإلكتروني (اختياري)
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  disabled={isEdit}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              {!isEdit && <FormMessage className="text-[11px] font-bold" />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold text-primary">
                العنوان (اختياري)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="الحي، الشارع"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage className="text-[11px] font-bold" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="work_days"
          render={() => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold text-primary">
                أيام الدورة
              </FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-1.5">
                  {WORK_DAYS_API.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={selectedWorkDays.includes(day) ? "default" : "secondary"}
                      size="sm"
                      className="rounded-xl"
                      onClick={() => toggleWorkDay(day)}
                    >
                      {WORK_DAYS_LABELS[day] || day}
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage className="text-[11px] font-bold" />
              {rep?.work_days?.length && selectedWorkDays.length === 0 && (
                <p className="text-[10px] text-muted-foreground">
                  سيتم استخدام أيام عملك الافتراضية: {rep.work_days.map((d) => WORK_DAYS_LABELS[d] || d).join(", ")}
                </p>
              )}
            </FormItem>
          )}
        />

        <div>
          <FormLabel className="mb-1.5 block text-[11px] font-bold text-primary">
            الموقع على الخريطة
          </FormLabel>
          <div className="space-y-2">
            <Button
              type="button"
              onClick={onPickLocation}
              variant="outline"
              className="w-full border-2 border-dashed border-primary bg-primary/8 py-3 text-xs text-primary"
            >
              <IconRenderer name="pin_outlined" className="w-6 h-6" />
              {pickedPoint ? "تعديل الموقع" : "حدد الموقع بالضغط على الخريطة"}
            </Button>
            <Button
              type="button"
              onClick={onUseMyLocation}
              disabled={isLoadingLocation}
              variant="secondary"
              className="w-full py-3 text-xs"
            >
              <IconRenderer
                name={isLoadingLocation ? "refresh_outlined" : "cursor_outlined"}
                className={cn("w-6 h-6", isLoadingLocation && "animate-spin")}
              />
              {isLoadingLocation ? "جاري جلب موقعك…" : "استخدم موقعي الحالي"}
            </Button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {pickedPoint
              ? `${pickedPoint[0].toFixed(5)}, ${pickedPoint[1].toFixed(5)}`
              : "لم يتم تحديد الموقع بعد"}
          </p>
          <FormMessage className="text-[11px] font-bold" />
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1 py-3.5 text-sm"
            >
              إلغاء
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 py-3.5 text-sm"
          >
            {isPending ? (
              <IconRenderer name="activity_log_outlined" className="w-6 h-6 animate-spin" />
            ) : (
              <IconRenderer name="tick_outlined" className="w-6 h-6" />
            )}
            {isPending ? "جاري الحفظ…" : isEdit ? "حفظ التعديلات" : "حفظ العميل"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

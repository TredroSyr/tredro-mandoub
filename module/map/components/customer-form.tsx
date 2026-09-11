"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "@/module/customers/hooks";
import { UpdateCustomerRequest } from "@/module/customers/types";
import type { Customer } from "@/module/customers/types";
import { reverseGeocode } from "@/module/map/lib/geo";
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
  /** DOM id assigned to the <form>, so a submit button outside it (e.g. in a drawer header) can trigger it via `form={formId}`. */
  formId?: string;
  /** Notified whenever the save/create mutation's pending state changes, so a header save button can reflect it. */
  onPendingChange?: (pending: boolean) => void;
}

export function CustomerForm({
  customer,
  pickedPoint,
  onPickLocation,
  onUseMyLocation,
  isLoadingLocation,
  onSuccess,
  onCancel,
  formId,
  onPendingChange,
}: CustomerFormProps) {
  const rep = useAuthStore((state) => state.rep);
  const isEdit = !!customer;
  // Once a customer has a location, the backend treats it as final and rejects
  // any update that resends latitude/longitude — reps can only set the location
  // the first time, not move it afterwards.
  const hasExistingLocation =
    isEdit && customer?.latitude != null && customer?.longitude != null;

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

  // Every time a new point is picked on the map, look up its address via
  // reverse geocoding and drop it into the free-text address field, so the
  // rep doesn't have to type it out by hand. A customer with an already
  // locked-in location (hasExistingLocation) never re-picks, so this never
  // fires for it.
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const geocodeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!pickedPoint || hasExistingLocation) return;

    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;

    setIsGeocodingAddress(true);
    reverseGeocode(pickedPoint[0], pickedPoint[1], controller.signal)
      .then((address) => {
        if (address) form.setValue("address", address, { shouldValidate: true });
      })
      .catch(() => {
        /* best-effort — rep can still type the address manually */
      })
      .finally(() => {
        if (geocodeAbortRef.current === controller) setIsGeocodingAddress(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedPoint, hasExistingLocation]);

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

  const isPending = isEdit
    ? updateCustomerMutation.isPending
    : createCustomerMutation.isPending;

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const onSubmit = (values: CreateCustomerValues) => {
    if (isEdit && customer) {
      const requestData: UpdateCustomerRequest = {
        address: values.address?.trim() ?? "",
      };
      if (
        !hasExistingLocation &&
        values.latitude !== undefined &&
        values.longitude !== undefined
      ) {
        requestData.latitude = Number(values.latitude.toFixed(6));
        requestData.longitude = Number(values.longitude.toFixed(6));
      }
      if (values.work_days && values.work_days.length > 0) {
        requestData.work_days = values.work_days;
      }
      updateCustomerMutation.mutate({
        customerId: customer.id,
        data: requestData,
      });
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

  const toggleWorkDay = (day: (typeof WORK_DAYS_API)[number]) => {
    const current = form.getValues("work_days") || [];
    const newDays = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    form.setValue("work_days", newDays as any, { shouldValidate: true });
  };

  const selectedWorkDays = form.watch("work_days") || [];
  const addressValue = form.watch("address");

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
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
              {isGeocodingAddress && (
                <p className="text-[10px] text-muted-foreground">
                  جاري تحديد العنوان من الموقع…
                </p>
              )}
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
                      variant={
                        selectedWorkDays.includes(day) ? "default" : "secondary"
                      }
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
                  سيتم استخدام أيام عملك الافتراضية:{" "}
                  {rep.work_days
                    .map((d) => WORK_DAYS_LABELS[d] || d)
                    .join(", ")}
                </p>
              )}
            </FormItem>
          )}
        />

        <div>
          <FormLabel className="mb-1.5 block text-[11px] font-bold text-primary">
            الموقع على الخريطة
          </FormLabel>
          {hasExistingLocation ? (
            <p className="text-[10px] text-muted-foreground">
              موقع المحل محدد بالفعل ولا يمكن تعديله
            </p>
          ) : (
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
                  name={
                    isLoadingLocation ? "refresh_outlined" : "cursor_outlined"
                  }
                  className={cn("w-6 h-6", isLoadingLocation && "animate-spin")}
                />
                {isLoadingLocation ? "جاري جلب موقعك…" : "استخدم موقعي الحالي"}
              </Button>
            </div>
          )}
          <div className="mt-2">
            {pickedPoint ? (
              addressValue ? (
                <Badge variant="secondary" className="text-[11px]">
                  {addressValue}
                </Badge>
              ) : isGeocodingAddress ? (
                <p className="text-[11px] text-muted-foreground">
                  جاري تحديد العنوان…
                </p>
              ) : null
            ) : (
              <p className="text-[11px] text-muted-foreground">
                لم يتم تحديد الموقع بعد
              </p>
            )}
          </div>
          <FormMessage className="text-[11px] font-bold" />
        </div>
      </form>
    </Form>
  );
}

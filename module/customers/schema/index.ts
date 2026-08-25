import { z } from "zod";

export const WORK_DAYS_API = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const WORK_DAYS_LABELS: Record<string, string> = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

// Phone validation for Syrian numbers: +963 followed by 9 digits
const syrianPhoneRegex = /^\+963\d{9}$/;

export const createCustomerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "اسم العميل مطلوب")
      .max(100, "الاسم يجب أن لا يتجاوز 100 حرف"),
    phone: z
      .string()
      .trim()
      .min(1, "رقم الهاتف مطلوب")
      .regex(syrianPhoneRegex, "رقم الهاتف غير صحيح. الصيغة المطلوبة: +963XXXXXXXXX"),
    email: z
      .string()
      .trim()
      .email("البريد الإلكتروني غير صحيح")
      .optional()
      .or(z.literal("")),
    address: z
      .string()
      .trim()
      .max(200, "العنوان يجب أن لا يتجاوز 200 حرف")
      .optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    work_days: z
      .array(z.enum(WORK_DAYS_API))
      .min(1, "يجب اختيار يوم عمل واحد على الأقل")
      .optional(),
  })
  .refine(
    (data) => {
      // Both latitude and longitude must be provided together, or neither
      const hasLat = data.latitude !== undefined && data.latitude !== null;
      const hasLng = data.longitude !== undefined && data.longitude !== null;
      return hasLat === hasLng;
    },
    {
      message: "يجب تقديم خطوط الطول والعرض معاً أو تركهما فارغين",
      path: ["latitude"],
    }
  );

export type CreateCustomerValues = z.infer<typeof createCustomerSchema>;

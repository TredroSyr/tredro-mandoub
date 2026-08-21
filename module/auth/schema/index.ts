import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

const phoneSchema = z
  .string()
  .min(1, "رقم الهاتف مطلوب")
  .refine((value) => isValidPhoneNumber(value), {
    message: "رقم الهاتف غير صحيح",
  });

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    company: z.string().trim().min(1, "اسم الشركة مطلوب").max(100),
    phone: phoneSchema,
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    confirm: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const onboardingSchema = z.object({
  country: z.string().min(1, "الدولة مطلوبة"),
  city: z.string().min(1, "المدينة مطلوبة"),
  address: z.string().trim().min(1, "عنوان الشركة مطلوب").max(200),
  specialty: z.string().min(1, "تخصص الشركة مطلوب"),
});
export type OnboardingValues = z.infer<typeof onboardingSchema>;

"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import TruckScene from "@/module/auth/components/truck-scene";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useKeyboardOpen } from "@/hooks/use-keyboard-open";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/tredro/phone-input";
import { useLoginMutation } from "@/module/auth/hook";
import { ApiErrorResponse } from "@/module/auth/types";

const loginSchema = z.object({
  phone: z
    .string()
    .min(9, "رقم الهاتف غير صالح")
    .regex(/^[0-9+]+$/, "رقم الهاتف غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const SHEET_TRANSITION = { duration: 0.35, ease: [0.32, 0.72, 0, 1] } as const;

// Diagnostic only — lets us trigger a real login against the known-paid
// auth-kadnya backend from the actual login screen, so cold-launch timing
// can be compared directly against our own backend's login button instead
// of only via background pings. Hardcodes a test account (ships in the APK
// bundle in plaintext) — remove this whole block before the store release.
const AUTH_KADNYA_TEST_CREDENTIALS = {
  email_or_phone: "safwatbilal331@gmail.com",
  lang: "en",
  login_type: "expert",
  password: "mp3rw4an",
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingAuthKadnya, setIsTestingAuthKadnya] = useState(false);
  const isKeyboardOpen = useKeyboardOpen();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const loginMutation = useLoginMutation({
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.entries(errors).forEach(([field, messages]) => {
          const fieldMap: Record<string, keyof LoginFormValues> = {
            phone: "phone",
            password: "password",
          };
          const mapped = fieldMap[field];
          if (mapped) {
            form.setError(mapped, { message: messages[0] });
          } else {
            toast.error(messages[0]);
          }
        });
      } else {
        toast.error(error.response?.data?.message || "حدث خطأ، حاول مرة أخرى");
      }
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      phone: values.phone,
      password: values.password,
    });
  };

  const testAuthKadnyaLogin = async () => {
    setIsTestingAuthKadnya(true);
    const start = Date.now();
    try {
      const response = await axios.post(
        "https://back-auth.kadnya-dev.com/auth/login/",
        AUTH_KADNYA_TEST_CREDENTIALS,
        { timeout: 60000 },
      );
      const ms = Date.now() - start;
      console.log(`[auth-kadnya-login] ok in ${ms}ms`, response.data);
      toast.success(`auth-kadnya: نجح الدخول خلال ${ms}ms`);
    } catch (error) {
      const ms = Date.now() - start;
      console.log(`[auth-kadnya-login] failed after ${ms}ms`, error);
      toast.error(`auth-kadnya: فشل بعد ${ms}ms`);
    } finally {
      setIsTestingAuthKadnya(false);
    }
  };

  return (
    <div className="relative flex flex-col overflow-hidden bg-primary">
      <AnimatePresence mode="wait" initial={false}>
        {isKeyboardOpen ? (
          <motion.div
            key="logo"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SHEET_TRANSITION}
            className="flex items-center justify-center bg-primary py-4"
          >
            <Image
              src="/tredro/full_logo.svg"
              alt="logo"
              width={140}
              height={70}
              className="h-auto w-27.5 object-contain"
            />
          </motion.div>
        ) : (
          <motion.div
            key="truck-scene"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SHEET_TRANSITION}
            className="relative overflow-hidden"
          >
            <TruckScene />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        layout
        transition={SHEET_TRANSITION}
        className="relative z-10 -mt-6 rounded-t-[2rem] bg-card px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-sheet"
      >
        <div className="mx-auto max-w-md">
          <h1 className="mt-1 text-2xl font-extrabold leading-tight">
            أهلاً بعودتك
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            سجّل دخولك لمتابعة جولتك. الحسابات تُنشأ من الإدارة فقط.
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-5 space-y-3"
            >
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold text-primary">
                      رقم الهاتف
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        id="phone"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] font-bold" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold text-primary">
                      كلمة المرور
                    </FormLabel>
                    <FormControl>
                      <div className="relative" dir="ltr">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label="إظهار كلمة المرور"
                          className="absolute inset-y-0 right-3 grid place-items-center text-muted-foreground"
                          tabIndex={-1}
                        >
                          <IconRenderer
                            name={
                              showPassword
                                ? "eye_invisible_outlined"
                                : "eye_visible_outlined"
                            }
                          />
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px] font-bold" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-extrabold text-primary-foreground shadow-float active:scale-[0.98] disabled:opacity-70"
              >
                {loginMutation.isPending ? (
                  <IconRenderer name="activity_log_outlined" />
                ) : (
                  <IconRenderer name="login_outlined" />
                )}
                {loginMutation.isPending ? "جاري تسجيل الدخول..." : "دخول"}
              </Button>
            </form>
          </Form>

          {/* Diagnostic only — remove before store release. */}
          <Button
            type="button"
            variant="outline"
            disabled={isTestingAuthKadnya}
            onClick={testAuthKadnyaLogin}
            className="mt-3 w-full border-dashed text-xs text-muted-foreground"
          >
            {isTestingAuthKadnya
              ? "جاري اختبار auth-kadnya..."
              : "اختبار تسجيل الدخول عبر auth-kadnya"}
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default LoginPage;

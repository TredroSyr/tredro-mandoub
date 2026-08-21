// hook.ts
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiErrorResponse, LoginCredentials } from "../types";
import { useAuthStore } from "../store/auth-store";
import { login } from "../api";

export const useLoginMutation = (options?: {
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["login"],
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (response) => {
      if (response?.success && response.data?.tokens) {
        setAuth(response.data.rep, response.data.tokens);
        if (!response.data.rep.company.onboarding_completed) {
          router.push("/auth/onboarding");
        } else {
          router.push("/");
        }
      } else {
        toast.error(response?.message || "فشل تسجيل الدخول");
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        toast.error(error.response?.data?.message || "فشل تسجيل الدخول");
      }
    },
  });
};

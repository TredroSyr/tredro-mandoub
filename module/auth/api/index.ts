// api.ts
import api from "@/lib/axios";
import { AuthApiResponse, LoginCredentials } from "../types";

export const login = async (
  credentials: LoginCredentials,
): Promise<AuthApiResponse> => {
  const response = await api.post<AuthApiResponse>(
    "/auth/rep/signin",
    credentials,
  );
  return response.data;
};

export const logout = async (refresh: string): Promise<void> => {
  await api.post("/auth/signout", { refresh });
};

export const refreshToken = async (
  refresh: string,
): Promise<{ success: boolean; data: { access: string } }> => {
  const response = await api.post("/auth/token/refresh", { refresh });
  return response.data;
};

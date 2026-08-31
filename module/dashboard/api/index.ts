import api from "@/lib/axios";
import { DashboardParams, DashboardResponse } from "../types";

export const getDashboard = async (params?: DashboardParams): Promise<DashboardResponse> => {
  const response = await api.get("/reps/dashboard/", { params });
  return response.data;
};

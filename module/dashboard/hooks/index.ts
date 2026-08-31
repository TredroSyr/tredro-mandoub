import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../api";
import { DashboardParams } from "../types";

export const useGetDashboardQuery = (params?: DashboardParams) => {
  return useQuery({
    queryKey: ["dashboard", params?.date, params?.date_from, params?.date_to, params?.limit],
    queryFn: () => getDashboard(params),
  });
};

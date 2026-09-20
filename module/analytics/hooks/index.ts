import { useQuery } from "@tanstack/react-query";
import { getMyInsights, getMyOverview, listCurrencies } from "../api";
import type { OverviewParams } from "../types";

export const useMyOverviewQuery = (params?: OverviewParams) =>
  useQuery({
    queryKey: ["analytics", "overview", params?.date_from, params?.date_to, params?.currency],
    queryFn: () => getMyOverview(params),
  });

// Insights are a bonus on top of the cards — no retries, the card just hides on failure.
export const useMyInsightsQuery = (params?: OverviewParams) =>
  useQuery({
    queryKey: ["analytics", "insights", params?.date_from, params?.date_to, params?.currency],
    queryFn: () => getMyInsights(params),
    retry: false,
  });

export const useCurrenciesQuery = () =>
  useQuery({
    queryKey: ["analytics", "currencies"],
    queryFn: listCurrencies,
    staleTime: 10 * 60 * 1000,
  });

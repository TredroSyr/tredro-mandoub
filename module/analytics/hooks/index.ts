import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMyInsights, getMyOverview, listCurrencies } from "../api";
import type { OverviewParams } from "../types";

// Every filter change is a new key — keep the previous answer on screen until the new one lands, otherwise the whole page flashes to skeletons.
export const useMyOverviewQuery = (params?: OverviewParams) =>
  useQuery({
    queryKey: ["analytics", "overview", params?.date_from, params?.date_to, params?.currency],
    queryFn: () => getMyOverview(params),
    placeholderData: keepPreviousData,
  });

// Insights are a bonus on top of the cards — no retries, the card just hides on failure.
export const useMyInsightsQuery = (params?: OverviewParams) =>
  useQuery({
    queryKey: ["analytics", "insights", params?.date_from, params?.date_to, params?.currency],
    queryFn: () => getMyInsights(params),
    retry: false,
    placeholderData: keepPreviousData,
  });

export const useCurrenciesQuery = () =>
  useQuery({
    queryKey: ["analytics", "currencies"],
    queryFn: listCurrencies,
    staleTime: 10 * 60 * 1000,
  });

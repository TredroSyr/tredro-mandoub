import api from "@/lib/axios";
import type { CurrenciesResponse, InsightsResponse, OverviewParams, RepOverviewResponse } from "../types";

/** The AI provider can be slow on the first request for new figures; the server gives up on it well before this. */
const INSIGHTS_TIMEOUT = 25_000;

export const getMyOverview = async (params?: OverviewParams): Promise<RepOverviewResponse> =>
  (await api.get("/reps/overview/", { params })).data;

export const getMyInsights = async (params?: OverviewParams): Promise<InsightsResponse> =>
  (await api.get("/reps/overview/insights/", { params, timeout: INSIGHTS_TIMEOUT })).data;

export const listCurrencies = async (): Promise<CurrenciesResponse> =>
  (await api.get("/currencies/")).data;

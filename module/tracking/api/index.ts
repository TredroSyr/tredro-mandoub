import api from "@/lib/axios";

/**
 * Rep tracking writes (backend doc "Rep Tracking API" §3). Times go out as
 * ISO 8601 with the device's offset — the device clock is trusted, so a rep
 * who was offline syncs the real times later.
 */

export interface DayEventBody {
  latitude?: number;
  longitude?: number;
  at: string;
}

export interface RepDaySession {
  id: number;
  date: string;
  started_at: string;
  ended_at: string | null;
}

export interface TrackingPoint {
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export type NoSaleReason = "shop_closed" | "owner_absent" | "enough_stock" | "come_back_later" | "other";

export interface CreateVisitPayload {
  customer: number;
  outcome?: "no_sale";
  reason: NoSaleReason;
  note?: string;
  latitude?: number;
  longitude?: number;
  at?: string;
}

export interface CreateVisitResponse {
  success: boolean;
  message: string;
  data: {
    visit: {
      id: number;
      customer: number;
      outcome: "no_sale";
      reason: NoSaleReason;
      note: string;
      latitude: string | null;
      longitude: string | null;
      visited_at: string;
      created_at: string;
    };
  };
}

/** 201 opens the day; 200 means it was already open (idempotent). */
export const startRepDay = async (body: DayEventBody) => {
  const response = await api.post<{ data: { day: RepDaySession } }>("/reps/day/start/", body);
  return response.data.data.day;
};

/** Ends today's day (or yesterday's past midnight). 400 `errors.day` when none was started. */
export const endRepDay = async (body: DayEventBody) => {
  const response = await api.post<{ data: { day: RepDaySession } }>("/reps/day/end/", body);
  return response.data.data.day;
};

/** At most 3000 points per call. Re-sending a batch is safe: same `recorded_at` is ignored. */
export const postRepLocations = async (points: TrackingPoint[]) => {
  const response = await api.post<{ data: { received: number; accepted: number } }>("/reps/locations/", { points });
  return response.data.data;
};

/** See module/invoices/api's createSalesInvoice re: idempotencyKey. */
export const createVisit = async (
  payload: CreateVisitPayload,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CreateVisitResponse> => {
  const response = await api.post<CreateVisitResponse>("/reps/visits/", payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
};

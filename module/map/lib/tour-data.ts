export type DayKey = "sat" | "sun" | "mon" | "tue" | "wed" | "thu";

export type Order = {
  id: string;
  item: string;
  qty: number;
};

export type Invoice = {
  id: string;
  no: string;
  date: string;
  amount: number;
  paid: boolean;
};

export type Payment = {
  id: string;
  date: string;
  amount: number;
};

export type Shop = {
  type: "branch";
  id: string;
  customerId: number;
  name: string;
  address: string;
  phone: string;
  day: DayKey;
  lat: number;
  lng: number;
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
};

/** Approximate city centers by Syrian governorate name, as returned by the company API (`rep.company.governorate`). Used as the map's default view before a real GPS/shop position is known. */
export const GOVERNORATE_CENTERS: Record<string, [number, number]> = {
  "حلب": [36.2021, 37.1343],
  "دمشق": [33.5138, 36.2765],
  "ريف دمشق": [33.5138, 36.3],
  "حمص": [34.7324, 36.7137],
  "حماة": [35.1318, 36.7578],
  "اللاذقية": [35.5197, 35.7833],
  "طرطوس": [34.8886, 35.8866],
  "إدلب": [35.9306, 36.6339],
  "الرقة": [35.95, 39.0167],
  "دير الزور": [35.3333, 40.15],
  "الحسكة": [36.5, 40.75],
  "درعا": [32.6189, 36.1021],
  "السويداء": [32.7047, 36.5661],
  "القنيطرة": [33.1264, 35.8244],
};

const DEFAULT_CENTER: [number, number] = GOVERNORATE_CENTERS["حلب"];

/** City center for a company's governorate, falling back to Aleppo for an unknown or missing value. */
export function getGovernorateCenter(
  governorate: string | null | undefined,
): [number, number] {
  if (!governorate) return DEFAULT_CENTER;
  return GOVERNORATE_CENTERS[governorate] ?? DEFAULT_CENTER;
}

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "sat", label: "السبت", short: "SAT" },
  { key: "sun", label: "الأحد", short: "SUN" },
  { key: "mon", label: "الاثنين", short: "MON" },
  { key: "tue", label: "الثلاثاء", short: "TUE" },
  { key: "wed", label: "الأربعاء", short: "WED" },
  { key: "thu", label: "الخميس", short: "THU" },
];

/** Today's DayKey. Friday (no workday in the map) falls back to Saturday. */
export function getTodayDayKey(): DayKey {
  const map: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "sat", "sat"];
  return map[new Date().getDay()] ?? "sun";
}

export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function formatMoney(n: number) {
  return `${n.toLocaleString("ar-SY")} ل.س`;
}

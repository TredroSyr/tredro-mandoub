import { CustomerRequestStatus } from "../types";

/** Latin (Western) digits everywhere, even inside Arabic-locale formatting — matches lib/format.ts. */
const NUMBERING_SYSTEM = { numberingSystem: "latn" } as const;

export const REQUEST_STATUS_META: Record<CustomerRequestStatus, { label: string; tone: string }> = {
  pending: { label: "بانتظار الموافقة", tone: "bg-warning/20 text-warning-foreground" },
  accepted: { label: "مقبول", tone: "bg-primary/15 text-primary" },
  fulfilled: { label: "تم التسليم", tone: "bg-success/15 text-success" },
  rejected: { label: "مرفوض", tone: "bg-destructive/15 text-destructive" },
  cancelled: { label: "ألغاه العميل", tone: "bg-muted text-muted-foreground" },
};

export const REQUEST_FILTERS: { key: CustomerRequestStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "معلّق" },
  { key: "accepted", label: "مقبول" },
  { key: "fulfilled", label: "مسلّم" },
  { key: "rejected", label: "مرفوض" },
];

const UNIT_NAME_AR: Record<string, string> = {
  Package: "عبوة",
  Liter: "لتر",
  KG: "كيلوغرام",
  Piece: "قطعة",
  Box: "صندوق",
  Carton: "كرتونة",
  Bottle: "زجاجة",
  Bag: "كيس",
  Meter: "متر",
  Gram: "غرام",
  Dozen: "دزينة",
  Set: "طقم",
  Roll: "لفة",
  Can: "علبة",
};

export function translateUnitName(unitName: string): string {
  return UNIT_NAME_AR[unitName] ?? unitName;
}

/** Money strings from the API are indicative and can be null — never render null as 0. */
export function formatRequestMoney(value: string | null): string {
  if (value == null) return "بدون سعر";
  const n = parseFloat(value);
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("ar-SY", NUMBERING_SYSTEM)} ل.س`;
}

export function formatRequestQuantity(value: string): string {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toLocaleString("ar-SY", NUMBERING_SYSTEM) : value;
}

export function formatRequestDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SY", NUMBERING_SYSTEM);
}

export const isRequestAnswerable = (status: CustomerRequestStatus) => status === "pending";

export const isRequestDeliverable = (status: CustomerRequestStatus) => status === "accepted";

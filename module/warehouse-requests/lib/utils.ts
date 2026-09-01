import { StockTransferLine, StockTransferStatus } from "../types";

export const PICKUP_HOURS_OPTIONS = [1, 2, 3, 4, 6];

export const TRANSFER_STATUS_META: Record<StockTransferStatus, { label: string; tone: string }> = {
  pending: { label: "بانتظار موافقة المستودع", tone: "bg-warning/20 text-warning-foreground" },
  modified_by_admin: { label: "تم تعديل الكميات", tone: "bg-primary/15 text-primary" },
  pending_rep_confirmation: { label: "تم تعديل الكميات", tone: "bg-primary/15 text-primary" },
  confirmed: { label: "جاهز للاستلام", tone: "bg-primary/15 text-primary" },
  received: { label: "تم التسليم", tone: "bg-success/15 text-success" },
  cancelled: { label: "ملغى", tone: "bg-destructive/15 text-destructive" },
};

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

export function formatTransferQuantity(value: string): string {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : value;
}

export function formatTransferDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB");
}

export function formatTransferTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** approved_qty is null until the company acts on the line — nothing to compare yet. */
export function isLineModified(line: StockTransferLine): boolean {
  return line.approved_qty != null && parseFloat(line.effective_qty) !== parseFloat(line.requested_qty);
}

export const needsRepConfirmation = (status: StockTransferStatus) => status === "pending_rep_confirmation";

export const isReceivable = (status: StockTransferStatus) => status === "confirmed";

export const isReceived = (status: StockTransferStatus) => status === "received";

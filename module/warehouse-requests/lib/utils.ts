import { StockTransferStatus } from "../types";

export const PICKUP_HOURS_OPTIONS = [1, 2, 3, 4, 6];

export const TRANSFER_STATUS_META: Record<StockTransferStatus, { label: string; tone: string }> = {
  pending: { label: "بانتظار موافقة المستودع", tone: "bg-warning/20 text-warning-foreground" },
  modified_by_admin: { label: "تم تعديل الكميات", tone: "bg-primary/15 text-primary" },
  pending_rep_confirmation: { label: "تم تعديل الكميات", tone: "bg-primary/15 text-primary" },
  confirmed: { label: "جاهز للاستلام", tone: "bg-primary/15 text-primary" },
  received: { label: "تم التسليم", tone: "bg-success/15 text-success" },
  cancelled: { label: "ملغى", tone: "bg-destructive/15 text-destructive" },
};

export function formatTransferMoney(value: string | null): string {
  if (value == null) return "بدون سعر";
  const n = parseFloat(value);
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("ar-SY")} ل.س`;
}

export function formatMoneyValue(value: number): string {
  return `${value.toLocaleString("ar-SY")} ل.س`;
}

export function formatTransferQuantity(value: string): string {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toLocaleString("ar-SY") : value;
}

export function formatTransferDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SY");
}

export function formatTransferTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export const needsRepConfirmation = (status: StockTransferStatus) => status === "pending_rep_confirmation";

export const isReceivable = (status: StockTransferStatus) => status === "confirmed";

export const isReceived = (status: StockTransferStatus) => status === "received";

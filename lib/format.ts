/** Latin (Western) digits everywhere, even inside Arabic-locale formatting — keeps numbers consistent instead of mixing Eastern Arabic-Indic and Latin digits. */
const NUMBERING_SYSTEM = { numberingSystem: "latn" } as const;

export function formatCurrency(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("ar-SY", NUMBERING_SYSTEM)} ل.س`;
}

export function formatQuantity(value: string) {
  const n = parseFloat(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString("ar-SY", {
    maximumFractionDigits: 2,
    ...NUMBERING_SYSTEM,
  });
}

/** ar-SY date formatting embeds bidi control chars (LRM/RLM/ALM) around each segment even with Latin digits, which scrambles visual order regardless of container `dir` — strip them. */
const BIDI_CONTROL_CHARS = /[‎‏؜]/g;

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-SY", NUMBERING_SYSTEM).replace(BIDI_CONTROL_CHARS, "");
}

/** ISO 4217 code → the label shown after an amount. */
const CURRENCY_LABEL: Record<string, string> = {
  SYP: "ل.س",
  USD: "$",
  EUR: "€",
  GBP: "£",
  TRY: "₺",
  SAR: "ر.س",
};

/** Amount and currency label as separate strings, for mixed styling. Pass the response's own `currency` — money is pinned per response. */
export function formatMoneyParts(value: string | number | null | undefined, currency?: string) {
  const n = Number(value ?? 0);
  const amount = (Number.isFinite(n) ? n : 0).toLocaleString("ar-SY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...NUMBERING_SYSTEM,
  });
  const label = currency ? (CURRENCY_LABEL[currency] ?? currency) : "ل.س";
  return { amount, label };
}

/** Compact "15 أغسطس" form for a date range subtitle — no year, no time. */
export function formatDateShort(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value)
    .toLocaleDateString("ar-SY", { day: "numeric", month: "short", ...NUMBERING_SYSTEM })
    .replace(BIDI_CONTROL_CHARS, "");
}

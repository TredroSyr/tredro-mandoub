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

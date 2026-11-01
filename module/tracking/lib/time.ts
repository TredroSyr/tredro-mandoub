const pad = (n: number, width = 2) => String(Math.trunc(Math.abs(n))).padStart(width, "0");

/** ISO 8601 with the device's own offset, e.g. 2026-10-31T08:22:00.000+03:00. */
export function toOffsetIso(date: Date = new Date()) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}` +
    `${sign}${pad(offset / 60)}:${pad(offset % 60)}`
  );
}

/** "YYYY-MM-DD" in Syria — a tracking day is a calendar day in Asia/Damascus. */
export function syriaDateKey(ms: number = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Damascus" }).format(new Date(ms));
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-SY", { hour: "numeric", minute: "2-digit", numberingSystem: "latn" });
}

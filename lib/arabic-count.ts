/**
 * Arabic counted-noun agreement for "item(s)":
 * 1 → عنصر واحد, 2 → عنصران, 3–10 → N عناصر, 11+ → N عنصرًا.
 */
export function countItems(n: number): string {
  if (n === 1) return "عنصر واحد";
  if (n === 2) return "عنصران";
  if (n >= 3 && n <= 10) return `${n} عناصر`;
  return `${n} عنصرًا`;
}

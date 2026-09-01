export const PRIMARY = "var(--primary)";
export const PRIMARY_SOFT = "var(--primary) / 0.35";
export const PRIMARY_SHADOW = "var(--primary) / 0.45";

/**
 * Canvas 2D's strokeStyle/fillStyle can't resolve `var(--x)` — it needs a literal
 * CSS color. Reading the custom property's own computed value (already resolved
 * against `:root`/`.dark` by the browser) gives a literal color string Canvas
 * accepts directly, so route lines pick up the actual theme color instead of
 * silently falling back to black.
 */
export function resolveThemeColor(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * The shop marker IS its label: a name chip stacked directly on top of a small
 * dot, touching with no gap, rather than a pin icon plus a separately-positioned
 * Leaflet tooltip. The dot marks the exact coordinate; `.shop-marker`'s CSS
 * `transform: translate(-50%, -100%)` centers the whole stack above it regardless
 * of the name's length, so the marker never needs to know its own rendered size.
 */
export const shopMarkerHtml = (name: string, active: boolean) => `
  <div class="shop-marker${active ? " shop-marker--active" : ""}">
    <span class="shop-marker__label">${escapeHtml(name)}</span>
    <span class="shop-marker__dot"></span>
  </div>
`;

export const truckSvg = (rotation: number) => {
  return `
    <div class="user-dot" style="position:relative;width:42px;height:42px;transform:rotate(${rotation}deg);">
      <span style="position:absolute;inset:7px;border-radius:9999px;background:${PRIMARY_SOFT};display:block;"></span>
      <span style="position:absolute;inset:7px;border-radius:9999px;background:${PRIMARY};border:3px solid var(--card);box-shadow:0 6px 14px ${PRIMARY_SHADOW};display:grid;place-items:center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--card)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(-90deg)">
          <path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2" />
          <path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      </span>
    </div>
  `;
};

export const flagSvg = `
  <div class="marker-pin" style="width:44px;height:44px;">
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="12" style="fill:${PRIMARY}" stroke="var(--card)" stroke-width="3" />
      <circle cx="22" cy="22" r="4" fill="var(--card)" />
    </svg>
  </div>
`;

export const stopBadgeSvg = (n: number) => `
  <div style="width:26px;height:26px;border-radius:9999px;background:${PRIMARY};border:2.5px solid var(--card);box-shadow:0 4px 10px ${PRIMARY_SHADOW};display:grid;place-items:center;color:var(--card);font:800 12px var(--font-mono, monospace);">
    ${n}
  </div>
`;

export function closestIndexOnRoute(
  point: [number, number],
  route: [number, number][],
): number {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < route.length; i++) {
    const distance = Math.hypot(route[i][0] - point[0], route[i][1] - point[1]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

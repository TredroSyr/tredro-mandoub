export const PRIMARY = "var(--primary)";
export const PRIMARY_SOFT = "var(--primary) / 0.35";
export const PRIMARY_SHADOW = "var(--primary) / 0.45";

export const storeSvg = (active: boolean) => {
  const s = active ? 1.1 : 0.82;

  return `
    <div class="marker-pin" style="width:${38 * s}px;height:${46 * s}px;">
      <svg width="${38 * s}" height="${46 * s}" viewBox="0 0 38 46" fill="none">
        <path
          d="M19 45C19 45 36 27.5 36 17.6C36 8.4 28.4 1 19 1C9.6 1 2 8.4 2 17.6C2 27.5 19 45 19 45Z"
          style="fill:${PRIMARY}"
          stroke="var(--card)"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
        <g transform="translate(9.5 9)" stroke="var(--card)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M0.6 4.2 2.2 0.8h14.6l1.6 3.4"/>
          <path d="M0.6 4.2c0 1.6 1.2 2.7 2.7 2.7S6 5.8 6 4.2c0 1.6 1.2 2.7 2.7 2.7s2.7-1.1 2.7-2.7c0 1.6 1.2 2.7 2.7 2.7s2.7-1.1 2.7-2.7"/>
          <path d="M2.3 7v9.4h14.4V7" />
          <path d="M7 16.4v-5h5v5" />
        </g>
      </svg>
    </div>
  `;
};

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

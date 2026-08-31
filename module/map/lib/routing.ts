export type RouteResult = {
  coords: [number, number][];
  distance: number; // meters
  duration: number; // seconds
  steps: { text: string; distance: number }[];
};

export type TripStop = {
  shop: Shop;
  legDistance: number; // meters, this leg only (from the previous stop)
  legDuration: number; // seconds, this leg only
  cumulativeDistance: number;
  cumulativeDuration: number;
};

export type TripResult = {
  coords: [number, number][];
  totalDistance: number;
  totalDuration: number;
  stops: TripStop[]; // in optimized visit order, origin excluded
};

import { Shop } from "./tour-data";

/** Google's encoded-polyline decoder (precision 5 by default). */
export function decodePolyline(str: string, precision = 5): [number, number][] {
  const factor = Math.pow(10, precision);
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < str.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lat / factor, lng / factor]);
  }
  return coords;
}

/** Initial bearing in degrees from a → b. */
export function bearing(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(a[0]);
  const φ2 = toRad(b[0]);
  const Δλ = toRad(b[1] - a[1]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

const memory = new Map<string, RouteResult>();
const KEY = (a: [number, number], b: [number, number]) =>
  `r:${a[0].toFixed(4)},${a[1].toFixed(4)}>${b[0].toFixed(4)},${b[1].toFixed(4)}`;

function readSession(key: string): RouteResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RouteResult) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: RouteResult) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

/**
 * Road-accurate route via OSRM (contraction-hierarchies engine).
 * Cached in memory + sessionStorage so panning/reopening never refetches.
 */
export async function fetchRoute(
  from: [number, number],
  to: [number, number],
  signal?: AbortSignal,
): Promise<RouteResult> {
  const key = KEY(from, to);
  const cached = memory.get(key) ?? readSession(key);
  if (cached) {
    memory.set(key, cached);
    return cached;
  }

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=polyline&steps=true&alternatives=false`;

  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = (await res.json()) as {
    code: string;
    routes?: {
      geometry: string;
      distance: number;
      duration: number;
      legs: { steps: { distance: number; name: string; maneuver: { type: string; modifier?: string } }[] }[];
    }[];
  };
  const r = json.routes?.[0];
  if (json.code !== "Ok" || !r) throw new Error("no route");

  const result: RouteResult = {
    coords: decodePolyline(r.geometry),
    distance: r.distance,
    duration: r.duration,
    steps: (r.legs?.[0]?.steps ?? []).map((s) => ({
      text: maneuverText(s.maneuver.type, s.maneuver.modifier, s.name),
      distance: s.distance,
    })),
  };

  memory.set(key, result);
  writeSession(key, result);
  return result;
}

/**
 * Multi-stop optimized route via OSRM's Trip API. `origin` is pinned as the
 * fixed start (source=first, no return leg since roundtrip=false). `shops`
 * order is arbitrary on input — the response's `waypoint_index` gives the
 * actual optimized visit order, which is used here both to reorder `shops`
 * and to pair each optimized leg's distance/duration back to the right shop.
 */
export async function fetchOptimizedTrip(
  origin: [number, number],
  shops: Shop[],
  signal?: AbortSignal,
): Promise<TripResult> {
  if (shops.length === 0) throw new Error("no shops to route");

  const coords = [origin, ...shops.map((s) => [s.lat, s.lng] as [number, number])];
  const coordStr = coords.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url =
    `https://router.project-osrm.org/trip/v1/driving/${coordStr}` +
    `?source=first&roundtrip=false&overview=full&geometries=polyline&steps=false`;

  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = (await res.json()) as {
    code: string;
    trips?: {
      geometry: string;
      distance: number;
      duration: number;
      legs: { distance: number; duration: number }[];
    }[];
    waypoints?: { waypoint_index: number; trips_index: number }[];
  };

  if (json.code !== "Ok" || !json.trips?.[0] || !json.waypoints) {
    throw new Error("no trip");
  }
  const trip = json.trips[0];

  // waypoints[0] is always the origin (input index 0). waypoints[i] for i>=1
  // corresponds to shops[i-1]. waypoint_index is that point's position in
  // the optimized visit order (0 = origin, since source=first pins it first).
  const inputIndexToVisitOrder = json.waypoints.map((w) => w.waypoint_index);
  const shopVisitOrder = shops
    .map((shop, i) => ({ shop, order: inputIndexToVisitOrder[i + 1] }))
    .sort((a, b) => a.order - b.order);

  let cumulativeDistance = 0;
  let cumulativeDuration = 0;
  const stops: TripStop[] = shopVisitOrder.map(({ shop }, legIdx) => {
    // trip.legs[legIdx] is the leg ARRIVING at this stop (leg 0 = origin -> 1st stop).
    const leg = trip.legs[legIdx] ?? { distance: 0, duration: 0 };
    cumulativeDistance += leg.distance;
    cumulativeDuration += leg.duration;
    return {
      shop,
      legDistance: leg.distance,
      legDuration: leg.duration,
      cumulativeDistance,
      cumulativeDuration,
    };
  });

  return {
    coords: decodePolyline(trip.geometry),
    totalDistance: trip.distance,
    totalDuration: trip.duration,
    stops,
  };
}

function maneuverText(type: string, modifier?: string, name?: string) {
  const dir =
    modifier === "left"
      ? "يسارًا"
      : modifier === "right"
        ? "يمينًا"
        : modifier === "slight left"
          ? "قليلًا لليسار"
          : modifier === "slight right"
            ? "قليلًا لليمين"
            : modifier === "sharp left"
              ? "بحدة لليسار"
              : modifier === "sharp right"
                ? "بحدة لليمين"
                : modifier === "uturn"
                  ? "استدارة كاملة"
                  : "";
  const road = name ? ` — ${name}` : "";
  switch (type) {
    case "depart":
      return `انطلق${road}`;
    case "arrive":
      return "وصلت إلى المحل";
    case "roundabout":
    case "rotary":
      return `ادخل الدوار${road}`;
    case "merge":
      return `اندمج ${dir}${road}`;
    case "fork":
      return `عند المفترق خذ ${dir}${road}`;
    case "new name":
      return `تابع مستقيمًا${road}`;
    default:
      return `${dir ? `انعطف ${dir}` : "تابع"}${road}`;
  }
}

export function formatDistance(m: number) {
  return m < 950 ? `${Math.round(m / 10) * 10} م` : `${(m / 1000).toFixed(1)} كم`;
}

export function formatDuration(s: number) {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} دقيقة`;
  return `${Math.floor(min / 60)} س ${min % 60} د`;
}

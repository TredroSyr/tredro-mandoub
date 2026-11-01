import { Capacitor } from "@capacitor/core";
import { Geolocation, type Position } from "@capacitor/geolocation";
import { enqueuePoint } from "./queue";
import { toOffsetIso } from "./time";

/**
 * GPS while the rep's day is running. A point goes out when the rep has moved
 * ~15 m, and at least once a minute even standing still — the backend reads a
 * 30-minute silence as the end of the day, so a long visit or lunch must keep
 * sending (the "heartbeat" in §3.3).
 *
 * This runs while the app is open; Android pauses the web view in the
 * background, and catching up then needs a native background-location plugin.
 */

/** Points less accurate than this are dropped by the server anyway. */
const MAX_ACCURACY_M = 100;
const MIN_MOVE_M = 15;
const HEARTBEAT_MS = 60_000;

export interface Fix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  /** Epoch ms of the fix. */
  time: number;
}

let lastFix: Fix | null = null;
let lastSent: { fix: Fix; at: number } | null = null;
let watchId: string | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
/** Bumped by every stop, so a start still waiting on the permission prompt knows it was cancelled. */
let generation = 0;

function metersBetween(a: Fix, b: Fix) {
  const R = 6_371_000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const finite = (n: number | null | undefined) => (typeof n === "number" && Number.isFinite(n) ? n : undefined);

function remember(pos: Position): Fix {
  const fix: Fix = {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: finite(pos.coords.accuracy) ?? null,
    time: pos.timestamp || Date.now(),
  };
  if (fix.accuracy == null || fix.accuracy <= MAX_ACCURACY_M) lastFix = fix;
  return fix;
}

function handle(pos: Position, force: boolean) {
  const fix = remember(pos);
  if (fix.accuracy != null && fix.accuracy > MAX_ACCURACY_M) return;
  // Same fix handed back twice — the server would ignore the repeat anyway.
  if (lastSent && fix.time <= lastSent.fix.time) return;
  const moved = !lastSent || metersBetween(lastSent.fix, fix) >= MIN_MOVE_M;
  const due = !lastSent || Date.now() - lastSent.at >= HEARTBEAT_MS - 5_000;
  if (!force && !moved && !due) return;

  const speed = finite(pos.coords.speed);
  const heading = finite(pos.coords.heading);
  enqueuePoint({
    latitude: fix.latitude,
    longitude: fix.longitude,
    recorded_at: toOffsetIso(new Date(fix.time)),
    ...(fix.accuracy != null ? { accuracy: Math.max(0, fix.accuracy) } : {}),
    ...(speed != null && speed >= 0 ? { speed } : {}),
    ...(heading != null && heading >= 0 && heading <= 360 ? { heading } : {}),
  });
  lastSent = { fix, at: Date.now() };
}

async function hasPermission() {
  if (!Capacitor.isNativePlatform()) return true; // the browser asks on first use
  const status = await Geolocation.checkPermissions();
  if (status.location === "granted") return true;
  const asked = await Geolocation.requestPermissions();
  return asked.location === "granted";
}

/** One fresh fix, or null if there's no permission / signal in time. */
export async function getFixOnce(timeout = 8_000): Promise<Fix | null> {
  try {
    if (!(await hasPermission())) return null;
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout, maximumAge: 0 });
    const fix = remember(pos);
    return fix.accuracy != null && fix.accuracy > MAX_ACCURACY_M ? null : fix;
  } catch {
    return null;
  }
}

/** The last good fix if it's recent enough to say where something happened. */
export function getRecentFix(maxAgeMs = 2 * 60_000): Fix | null {
  return lastFix && Date.now() - lastFix.time <= maxAgeMs ? lastFix : null;
}

/** `{ latitude, longitude }` from a recent fix, rounded to the 6 decimals the server stores — or nothing. */
export function recentCoords(): { latitude: number; longitude: number } | Record<string, never> {
  const fix = getRecentFix();
  return fix ? { latitude: Number(fix.latitude.toFixed(6)), longitude: Number(fix.longitude.toFixed(6)) } : {};
}

export async function startTracking(): Promise<"ok" | "denied" | "unavailable"> {
  if (watchId || heartbeat) return "ok";
  const run = generation;
  try {
    if (!(await hasPermission())) return "denied";
  } catch {
    return "unavailable";
  }
  if (run !== generation || heartbeat) return "ok";
  heartbeat = setInterval(async () => {
    if (lastSent && Date.now() - lastSent.at < HEARTBEAT_MS - 5_000) return;
    // Standing still, the watch goes quiet; ask for a fresh fix so the minute still gets its point.
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 });
      handle(pos, true);
    } catch {
      // No fix this minute; the next tick tries again.
    }
  }, HEARTBEAT_MS);
  try {
    const id = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 30_000 }, (pos, err) => {
      if (pos && !err) handle(pos, false);
    });
    if (run !== generation) await Geolocation.clearWatch({ id });
    else watchId = id;
  } catch {
    // The heartbeat still records a point a minute.
  }
  return "ok";
}

export async function stopTracking() {
  generation++;
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  const id = watchId;
  watchId = null;
  lastSent = null;
  if (id) await Geolocation.clearWatch({ id }).catch(() => {});
}

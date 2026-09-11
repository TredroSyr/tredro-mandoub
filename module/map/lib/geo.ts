import { Geolocation, type Position } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";

export type GeoWatchId = string;

export class GeoPermissionError extends Error {
  constructor() {
    super("permission-denied");
    this.name = "GeoPermissionError";
  }
}

/** الموقع غير متاح لأن الصفحة مش مفتوحة عبر HTTPS (أو localhost). */
export class GeoInsecureContextError extends Error {
  constructor() {
    super("insecure-context");
    this.name = "GeoInsecureContextError";
  }
}

function assertSecureContext() {
  if (typeof window === "undefined") return;
  // isSecureContext بتكون true لـ https وكمان لـ localhost وقت التطوير
  if (!Capacitor.isNativePlatform() && window.isSecureContext === false) {
    throw new GeoInsecureContextError();
  }
}

async function ensurePermission() {
  if (!Capacitor.isNativePlatform()) return true; // browser prompts natively via getCurrentPosition
  const status = await Geolocation.checkPermissions();
  if (status.location === "granted") return true;
  const req = await Geolocation.requestPermissions();
  return req.location === "granted";
}

/** One-shot high-accuracy fix. Resolves to [lat, lng] or throws GeoPermissionError / GeoInsecureContextError. */
export async function getCurrentPosition(): Promise<[number, number]> {
  assertSecureContext();
  const ok = await ensurePermission();
  if (!ok) throw new GeoPermissionError();
  const pos: Position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 8000,
  });
  return [pos.coords.latitude, pos.coords.longitude];
}

/**
 * Continuous tracking (used while navigating to a shop).
 * Returns a watch id you must pass to clearWatch on cleanup.
 * onError receives a reason so the caller can show the right message
 * ("permission" for denied access, "insecure" for missing https,
 * "unavailable" for any other failure).
 */
export async function watchPosition(
  onUpdate: (pos: [number, number], headingDeg: number | null) => void,
  onError: (reason: "permission" | "insecure" | "unavailable") => void,
): Promise<GeoWatchId> {
  try {
    assertSecureContext();
  } catch {
    onError("insecure");
    return "";
  }
  const ok = await ensurePermission();
  if (!ok) {
    onError("permission");
    return "";
  }
  const id = await Geolocation.watchPosition(
    { enableHighAccuracy: true, timeout: 15000 },
    (pos, err) => {
      if (err || !pos) {
        onError("unavailable");
        return;
      }
      const heading =
        typeof pos.coords.heading === "number" &&
        !Number.isNaN(pos.coords.heading)
          ? pos.coords.heading
          : null;
      onUpdate([pos.coords.latitude, pos.coords.longitude], heading);
    },
  );
  return id;
}

export async function clearWatch(id: GeoWatchId) {
  if (!id) return;
  await Geolocation.clearWatch({ id });
}

/**
 * Reverse-geocodes a point into a detailed free-text address (street/area,
 * city, district, state — every level Nominatim returns), via OSM's
 * Nominatim — the same OSM stack the map tiles and OSRM routing already
 * rely on. Returns null when nothing usable comes back.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}` +
    `&addressdetails=1&accept-language=ar`;

  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const json = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };

  if (!json.display_name) return null;

  // display_name is already ordered most-specific-first (street/suburb ...
  // city ... district ... state ... country) — reuse it wholesale for detail
  // instead of hand-picking fields, since not every response has the same
  // fields populated (e.g. "road" is often blank for residential areas).
  // The trailing country segment is dropped: the app only operates within
  // Syria, so it's redundant on every address.
  let segments = json.display_name
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const country = json.address?.country;
  if (country && segments[segments.length - 1] === country) {
    segments = segments.slice(0, -1);
  }

  return segments.length > 0 ? segments.join("، ") : json.display_name;
}

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

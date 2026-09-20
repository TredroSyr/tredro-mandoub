import { Capacitor } from "@capacitor/core";

/**
 * True only inside the installed Android/iOS app. Every offline behavior
 * (local database, outbox, offline-first query modes, sync triggers) is
 * gated on this, so the plain web build behaves exactly as it always did.
 */
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * A small history of what the outbox has synced. A synced item is deleted
 * from the outbox, so without this there would be nothing left to show the
 * rep "this went through while you were away".
 *
 * `unseenSynced()` is everything synced since the rep last dismissed the
 * summary (`acknowledgeSyncLog()`).
 */
export interface SyncLogEntry {
  id: string;
  kind: string;
  label: string;
  /** ISO timestamp — compares correctly as a plain string. */
  at: string;
}

const LOG_KEY = "tredro_sync_log_v1";
const ACK_KEY = "tredro_sync_ack_v1";
const MAX_ENTRIES = 50;

/** How long a synced item stays in the history before it is deleted. */
export const SYNC_LOG_RETENTION_DAYS = 2;
const RETENTION_MS = SYNC_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function isWithinRetention(entry: SyncLogEntry): boolean {
  const at = Date.parse(entry.at);
  return !Number.isNaN(at) && Date.now() - at < RETENTION_MS;
}

/** Returns the history with anything older than the retention window removed — and deleted from storage. */
export function readSyncLog(): SyncLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOG_KEY) ?? "[]");
    const stored = Array.isArray(parsed) ? (parsed as SyncLogEntry[]) : [];
    const fresh = stored.filter(isWithinRetention);
    if (fresh.length !== stored.length) {
      window.localStorage.setItem(LOG_KEY, JSON.stringify(fresh));
    }
    return fresh;
  } catch {
    return [];
  }
}

export function recordSynced(entry: Omit<SyncLogEntry, "at">): void {
  if (typeof window === "undefined") return;
  try {
    const log = readSyncLog();
    log.push({ ...entry, at: new Date().toISOString() });
    window.localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-MAX_ENTRIES)));
  } catch {
    // Storage full/unavailable — the history is a nicety, never block a sync on it.
  }
}

export function unseenSynced(): SyncLogEntry[] {
  if (typeof window === "undefined") return [];
  const ack = window.localStorage.getItem(ACK_KEY) ?? "";
  return readSyncLog().filter((entry) => entry.at > ack);
}

export function acknowledgeSyncLog(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACK_KEY, new Date().toISOString());
  } catch {}
}

/** Called on sign-out so the next rep never sees the previous rep's history. */
export function clearSyncLog(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOG_KEY);
    window.localStorage.removeItem(ACK_KEY);
  } catch {}
}

/** "قبل 5 د" style relative time. */
export function formatAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "الآن";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  return `قبل ${Math.round(hours / 24)} يوم`;
}

// While the launch summary is on screen it owns the "what just synced"
// message, so the foreground toast stays quiet instead of repeating it.
let summaryBusy = false;
export const setSummaryBusy = (busy: boolean) => {
  summaryBusy = busy;
};
export const isSummaryBusy = () => summaryBusy;

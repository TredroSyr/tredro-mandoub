import { isTransportFailure } from "@/lib/sync/errors";
import { endRepDay, postRepLocations, startRepDay, type DayEventBody, type TrackingPoint } from "../api";

/**
 * Ordered, durable queue for the rep's day: "start my day", GPS points, "end
 * my day". The server only keeps points that fall inside a started day, so
 * these must reach it in the order they happened — one queue, sent strictly
 * head first, guarantees that even after a long offline stretch.
 *
 * Kept apart from the sync outbox on purpose: a day produces thousands of
 * points, which don't belong in the rep's "items to sync" list. Lives in
 * localStorage, so it survives an app restart and also works on the web build.
 */

type Entry =
  | { id: string; type: "day_start" | "day_end"; body: DayEventBody }
  | { id: string; type: "points"; points: TrackingPoint[] };

const STORAGE_KEY = "tredro_tracking_queue_v1";
/** Server limit per POST /reps/locations/. */
const MAX_BATCH = 3000;
/** A week offline at one point a minute is ~6k points; past this, the oldest go first. */
const MAX_QUEUED_POINTS = 30_000;

function read(): Entry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Entry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: Entry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("[tracking] failed to save queue", error);
  }
}

/** Entry being sent right now — new points must not be appended to it mid-flight. */
let sendingId: string | null = null;

function trimPoints(entries: Entry[]) {
  let total = entries.reduce((n, e) => n + (e.type === "points" ? e.points.length : 0), 0);
  for (const entry of entries) {
    if (total <= MAX_QUEUED_POINTS) break;
    if (entry.type !== "points" || entry.id === sendingId) continue;
    const drop = Math.min(entry.points.length, total - MAX_QUEUED_POINTS);
    entry.points.splice(0, drop);
    total -= drop;
  }
  return entries.filter((e) => e.type !== "points" || e.points.length > 0);
}

export function enqueuePoint(point: TrackingPoint) {
  const entries = read();
  const last = entries[entries.length - 1];
  if (last?.type === "points" && last.id !== sendingId && last.points.length < MAX_BATCH) {
    last.points.push(point);
  } else {
    entries.push({ id: crypto.randomUUID(), type: "points", points: [point] });
  }
  write(trimPoints(entries));
  // Online, each point goes out as it's taken — that's what moves the car on the dashboard.
  void flushTrackingQueue();
}

export function enqueueDayEvent(type: "day_start" | "day_end", body: DayEventBody) {
  write([...read(), { id: crypto.randomUUID(), type, body }]);
  void flushTrackingQueue();
}

export function pendingTrackingCount() {
  return read().reduce((n, e) => n + (e.type === "points" ? e.points.length : 1), 0);
}

function send(entry: Entry) {
  if (entry.type === "points") return postRepLocations(entry.points);
  return entry.type === "day_start" ? startRepDay(entry.body) : endRepDay(entry.body);
}

/** Worth sending again later: no connection, a signed-out session, rate limiting or a server fault. */
function isRetryable(error: unknown) {
  if (isTransportFailure(error)) return true;
  const status = (error as { response?: { status?: number } } | null)?.response?.status ?? 0;
  return status === 401 || status === 429 || status >= 500;
}

async function runFlush() {
  for (;;) {
    const head = read()[0];
    if (!head) return;
    sendingId = head.id;
    try {
      await send(head);
    } catch (error) {
      if (isRetryable(error)) return;
      // A real rejection (e.g. ending a day that was never started) will never pass; drop it
      // so it can't block everything queued behind it.
      console.warn("[tracking] server rejected queued entry", head.type, error);
    } finally {
      sendingId = null;
    }
    write(read().filter((e) => e.id !== head.id));
  }
}

let inFlight: Promise<void> | null = null;

/** Sends the queue head first, one entry at a time. Concurrent callers share the run in progress. */
export function flushTrackingQueue(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!inFlight) {
    inFlight = runFlush()
      .catch((error) => console.error("[tracking] flush failed", error))
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

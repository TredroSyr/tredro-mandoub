import axios from "axios";
import {
  listOutboxItems,
  markOutboxItem,
  removeOutboxItem,
  rekeyOutboxItem,
  type OutboxItem,
} from "@/lib/db/outbox";
import { isTransportFailure } from "./errors";
import { replayOutboxItem } from "./replay";
import { recordSynced } from "./sync-log";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message
    );
  }
  return error instanceof Error ? error.message : "خطأ غير معروف";
}

type ReplayOutcome = "synced" | "offline" | "failed";

async function replayOne(item: OutboxItem): Promise<ReplayOutcome> {
  try {
    await markOutboxItem(item.id, { status: "syncing" });
    await replayOutboxItem(item);
    await removeOutboxItem(item.id);
    recordSynced({ id: item.id, kind: item.kind, label: item.label });
    return "synced";
  } catch (error) {
    if (isTransportFailure(error)) {
      // Still no connection — that's not a rejection. Leave it pending so it
      // is retried automatically, instead of marking it failed for the rep.
      await markOutboxItem(item.id, { status: "pending" });
      return "offline";
    }
    await markOutboxItem(item.id, {
      status: "failed",
      errorMessage: errorMessage(error),
      incrementAttempt: true,
    });
    return "failed";
  }
}

export interface FlushResult {
  /** Items the server accepted during this flush. */
  synced: number;
  /** Items the server rejected during this flush (they wait for the rep). */
  failed: number;
}

async function runFlush(): Promise<FlushResult> {
  let synced = 0;
  let failed = 0;
  const items = await listOutboxItems();
  for (const item of items) {
    // Server-rejected items wait for the rep (retry / edit / discard) —
    // never re-sent automatically on every flush.
    if (item.status === "failed") continue;
    const outcome = await replayOne(item);
    if (outcome === "synced") synced += 1;
    if (outcome === "failed") failed += 1;
    // The connection dropped again — stop and leave the rest pending.
    if (outcome === "offline") break;
  }
  return { synced, failed };
}

let inFlight: Promise<FlushResult> | null = null;

/**
 * Replays every pending outbox item, oldest first, one at a time — never in
 * parallel, since these are financial actions and must land on the server in
 * the order the rep performed them. An item the server rejects is left in
 * `failed` status (for the rep to review) and the flush moves on, so one
 * stuck item never blocks the queue.
 *
 * Concurrent callers (launch summary, reconnect trigger, retry timer) share
 * the one run in progress and get its result, rather than starting another.
 */
export function flushOutbox(): Promise<FlushResult> {
  if (!inFlight) {
    inFlight = runFlush().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/**
 * Retries a single item on demand — the retry action in the sync-issues list.
 * An item the server rejected goes out under a fresh key (see
 * rekeyOutboxItem); one that just never got through keeps its own.
 */
export async function retryOutboxItem(id: string): Promise<void> {
  const items = await listOutboxItems();
  const found = items.find((i) => i.id === id);
  if (!found) return;
  const item = found.status === "failed" ? await rekeyOutboxItem(id) : found;
  if (item) await replayOne(item);
}

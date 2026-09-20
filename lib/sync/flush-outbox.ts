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

let flushing = false;

/**
 * Replays every pending/failed outbox item, oldest first, one at a time —
 * never in parallel, since these are financial actions and must land on the
 * server in the order the rep performed them. An item the server rejects is
 * left in `failed` status (for the rep to review) and the flush moves on, so
 * one stuck item never blocks the queue. If the connection drops again the
 * flush stops and leaves the rest pending for the next attempt.
 */
export async function flushOutbox(): Promise<number> {
  if (flushing) return 0; // a flush is already running — don't overlap it
  flushing = true;
  let synced = 0;
  try {
    const items = await listOutboxItems();
    for (const item of items) {
      // Server-rejected items wait for the rep (retry / edit / discard) —
      // never re-sent automatically on every flush.
      if (item.status === "failed") continue;
      const outcome = await replayOne(item);
      if (outcome === "synced") synced += 1;
      if (outcome === "offline") break;
    }
  } finally {
    flushing = false;
  }
  return synced;
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

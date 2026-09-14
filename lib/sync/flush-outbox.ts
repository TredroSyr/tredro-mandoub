import axios from "axios";
import {
  listOutboxItems,
  markOutboxItem,
  removeOutboxItem,
  type OutboxItem,
} from "@/lib/db/outbox";
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

async function replayOne(item: OutboxItem): Promise<void> {
  try {
    await markOutboxItem(item.id, { status: "syncing" });
    await replayOutboxItem(item);
    await removeOutboxItem(item.id);
  } catch (error) {
    await markOutboxItem(item.id, {
      status: "failed",
      errorMessage: errorMessage(error),
      incrementAttempt: true,
    });
  }
}

let flushing = false;

/**
 * Replays every pending/failed outbox item, oldest first, one at a time —
 * never in parallel, since these are financial actions and must land on the
 * server in the order the rep performed them. An item that fails again is
 * left in `failed` status (for the rep to review) and the flush moves on to
 * the next one, so a single stuck item never blocks the rest of the queue.
 */
export async function flushOutbox(): Promise<void> {
  if (flushing) return; // a flush is already running — don't overlap it
  flushing = true;
  try {
    const items = await listOutboxItems();
    for (const item of items) {
      await replayOne(item);
    }
  } finally {
    flushing = false;
  }
}

/** Retries a single item on demand — the "إعادة المحاولة" action in the sync-issues list. */
export async function retryOutboxItem(id: string): Promise<void> {
  const items = await listOutboxItems();
  const item = items.find((i) => i.id === id);
  if (item) await replayOne(item);
}

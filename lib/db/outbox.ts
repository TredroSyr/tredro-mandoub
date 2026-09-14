import { getDb } from "./sqlite";

export type OutboxStatus = "pending" | "syncing" | "synced" | "failed";

export interface OutboxItem {
  /** The same Idempotency-Key sent to the server on every replay attempt. */
  id: string;
  /** Which api function replays this item — see lib/sync/replay.ts. */
  kind: string;
  /** Human-readable summary for the sync-issues screen, e.g. "فاتورة لعميل أحمد". */
  label: string;
  payload: unknown;
  status: OutboxStatus;
  errorMessage: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
}

type OutboxRow = {
  id: string;
  kind: string;
  label: string;
  payload: string;
  status: OutboxStatus;
  error_message: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
};

function rowToItem(row: OutboxRow): OutboxItem {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    payload: JSON.parse(row.payload),
    status: row.status,
    errorMessage: row.error_message,
    attemptCount: row.attempt_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Queues a write for later replay. `id` must be the same Idempotency-Key
 * that will be sent on every retry attempt — generate it once at the call
 * site (the mutation hook's useRef), never inside this function, or replays
 * stop being safe to retry.
 *
 * A no-op on web (see lib/db/sqlite.ts) — the caller decides what to do when
 * there's nowhere to durably queue the write.
 */
export async function enqueueOutboxItem(item: {
  id: string;
  kind: string;
  label: string;
  payload: unknown;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO outbox (id, kind, label, payload, status, attempt_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', 0, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    [item.id, item.kind, item.label, JSON.stringify(item.payload), now, now],
  );
  return true;
}

export async function listOutboxItems(): Promise<OutboxItem[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.query("SELECT * FROM outbox ORDER BY created_at ASC");
  const rows = (result.values ?? []) as OutboxRow[];
  return rows.map(rowToItem);
}

/** Pending + failed items — what the sync badge/screen should count and list. */
export async function listUnsyncedOutboxItems(): Promise<OutboxItem[]> {
  return (await listOutboxItems()).filter((item) => item.status !== "synced");
}

export async function markOutboxItem(
  id: string,
  update: {
    status: OutboxStatus;
    errorMessage?: string | null;
    incrementAttempt?: boolean;
  },
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = new Date().toISOString();
  await db.run(
    `UPDATE outbox
     SET status = ?, error_message = ?, updated_at = ?,
         attempt_count = attempt_count + ?
     WHERE id = ?`,
    [
      update.status,
      update.errorMessage ?? null,
      now,
      update.incrementAttempt ? 1 : 0,
      id,
    ],
  );
}

/** Called once an item is confirmed synced, or the rep explicitly discards it. */
export async function removeOutboxItem(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.run("DELETE FROM outbox WHERE id = ?", [id]);
}

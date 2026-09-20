import { isNativeApp } from "@/lib/native";
import { describeError, getDb, runSerialized } from "./sqlite";

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

// ---------------------------------------------------------------------------
// localStorage fallback. SQLite is the primary store, but if it can't be
// opened on a device, a queued write must still survive an app restart rather
// than be lost — so it lands here instead. Both stores are always read
// together, so nothing is ever stranded in the one that isn't active.
// ---------------------------------------------------------------------------
const LS_KEY = "tredro_outbox_v1";

function lsRead(): OutboxRow[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LS_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as OutboxRow[]) : [];
  } catch {
    return [];
  }
}

function lsWrite(rows: OutboxRow[]): boolean {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(rows));
    return true;
  } catch (error) {
    console.error("[offline-db] localStorage outbox write failed", error);
    return false;
  }
}

async function sqlRows(): Promise<OutboxRow[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await runSerialized(async () => {
      const result = await db.query(
        "SELECT * FROM outbox ORDER BY created_at ASC",
      );
      return (result.values ?? []) as OutboxRow[];
    });
  } catch (error) {
    console.error("[offline-db] outbox read failed", error);
    return [];
  }
}

/**
 * Queues a write for later replay. `id` must be the same Idempotency-Key
 * that will be sent on every retry attempt — generate it once at the call
 * site, never inside this function, or replays stop being safe to retry.
 *
 * Returns true only if the item was durably stored somewhere. False on web
 * (no offline mode) or if every store failed — the caller must then surface
 * the original error rather than claim it was saved.
 */
export async function enqueueOutboxItem(item: {
  id: string;
  kind: string;
  label: string;
  payload: unknown;
}): Promise<boolean> {
  if (!isNativeApp()) return false;

  const now = new Date().toISOString();
  const payload = JSON.stringify(item.payload);

  const db = await getDb();
  if (db) {
    try {
      await runSerialized(() =>
        db.run(
          `INSERT INTO outbox (id, kind, label, payload, status, attempt_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'pending', 0, ?, ?)
           ON CONFLICT(id) DO NOTHING`,
          [item.id, item.kind, item.label, payload, now, now],
        ),
      );
      return true;
    } catch (error) {
      console.error(
        "[offline-db] SQLite enqueue failed, using localStorage:",
        describeError(error),
      );
    }
  }

  const rows = lsRead();
  if (!rows.some((r) => r.id === item.id)) {
    rows.push({
      id: item.id,
      kind: item.kind,
      label: item.label,
      payload,
      status: "pending",
      error_message: null,
      attempt_count: 0,
      created_at: now,
      updated_at: now,
    });
    return lsWrite(rows);
  }
  return true;
}

export async function listOutboxItems(): Promise<OutboxItem[]> {
  if (!isNativeApp()) return [];
  const merged = new Map<string, OutboxRow>();
  for (const row of lsRead()) merged.set(row.id, row);
  for (const row of await sqlRows()) merged.set(row.id, row);
  return [...merged.values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(rowToItem);
}

export async function outboxCounts(): Promise<{ sqlite: number; localStorage: number }> {
  return { sqlite: (await sqlRows()).length, localStorage: lsRead().length };
}

export async function markOutboxItem(
  id: string,
  update: {
    status: OutboxStatus;
    errorMessage?: string | null;
    incrementAttempt?: boolean;
  },
): Promise<void> {
  if (!isNativeApp()) return;
  const now = new Date().toISOString();
  const bump = update.incrementAttempt ? 1 : 0;

  const db = await getDb();
  if (db) {
    try {
      await runSerialized(() =>
        db.run(
          `UPDATE outbox
           SET status = ?, error_message = ?, updated_at = ?,
               attempt_count = attempt_count + ?
           WHERE id = ?`,
          [update.status, update.errorMessage ?? null, now, bump, id],
        ),
      );
    } catch (error) {
      console.error("[offline-db] outbox update failed", describeError(error));
    }
  }

  const rows = lsRead();
  const row = rows.find((r) => r.id === id);
  if (row) {
    row.status = update.status;
    row.error_message = update.errorMessage ?? null;
    row.updated_at = now;
    row.attempt_count += bump;
    lsWrite(rows);
  }
}

/** Called once an item is confirmed synced, or the rep explicitly discards it. */
export async function removeOutboxItem(id: string): Promise<void> {
  if (!isNativeApp()) return;

  const db = await getDb();
  if (db) {
    try {
      await runSerialized(() => db.run("DELETE FROM outbox WHERE id = ?", [id]));
    } catch (error) {
      console.error("[offline-db] outbox delete failed", describeError(error));
    }
  }

  const rows = lsRead();
  if (rows.some((r) => r.id === id)) {
    lsWrite(rows.filter((r) => r.id !== id));
  }
}

/**
 * Gives an item a fresh id (= a fresh Idempotency-Key) and returns it as
 * pending. Used to retry an item the server REJECTED: the server may have
 * remembered the rejection under the old key, so replaying that key could
 * just return the same failure. Items that merely never reached the server
 * keep their key — reusing it is what makes their retry safe.
 */
export async function rekeyOutboxItem(id: string): Promise<OutboxItem | null> {
  const item = (await listOutboxItems()).find((i) => i.id === id);
  if (!item) return null;
  const newId = crypto.randomUUID();
  const queued = await enqueueOutboxItem({
    id: newId,
    kind: item.kind,
    label: item.label,
    payload: item.payload,
  });
  if (!queued) return null;
  await removeOutboxItem(id);
  return (await listOutboxItems()).find((i) => i.id === newId) ?? null;
}

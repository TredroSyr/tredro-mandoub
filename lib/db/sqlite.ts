import { isNativeApp } from "@/lib/native";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

const DB_NAME = "tredro_mandoub";
const DB_VERSION = 1;
const OPEN_TIMEOUT_MS = 6000;
// After a failed open, don't hammer the plugin on every poll/write.
const RETRY_COOLDOWN_MS = 30_000;

/**
 * Schema for the local offline store.
 *
 * `outbox`: durable queue of writes made while offline (or that failed to
 * confirm). `id` is the same Idempotency-Key sent to the server, so a
 * queued item can be replayed verbatim on reconnect without minting a new
 * key — see the idempotencyKey plumbing in each module's api and hooks files.
 *
 * `query_cache`: a single-row blob store backing the React Query persister
 * (lib/db/query-persister.ts), so cached reads (customers, invoices, ...)
 * survive the app being fully killed while offline.
 */
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS outbox (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    label TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS query_cache (
    cache_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

/** Live state of the local database — read by the diagnostics screen. */
export const dbStatus: {
  state: "idle" | "opening" | "open" | "failed";
  error: string | null;
} = { state: "idle", error: null };

let connection: SQLiteConnection | null = null;
let dbPromise: Promise<SQLiteDBConnection | null> | null = null;
let failedAt = 0;

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${what} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function openConnection(): Promise<SQLiteDBConnection> {
  if (!connection) connection = new SQLiteConnection(CapacitorSQLite);

  // Per the plugin's own usage guide: after a WebView reload the native side
  // can still hold a connection the JS side has forgotten, and createConnection
  // then throws. checkConnectionsConsistency() reconciles the two first.
  const consistent = (await connection.checkConnectionsConsistency()).result;
  const alreadyOpen = (await connection.isConnection(DB_NAME, false)).result;
  const db =
    consistent && alreadyOpen
      ? await connection.retrieveConnection(DB_NAME, false)
      : await connection.createConnection(
          DB_NAME,
          false, // encrypted — off for now, see the offline-mode report's
          // export-compliance note before ever flipping this on.
          "no-encryption",
          DB_VERSION,
          false,
        );

  await db.open();
  await db.execute(SCHEMA_SQL);
  return db;
}

/**
 * Lazily opens (once) and returns the shared connection; null on web, or if
 * the native database could not be opened (never hangs: the open is bounded
 * by a timeout). A failure is recorded in `dbStatus`, logged, and retried
 * after a cool-down — callers fall back to localStorage meanwhile.
 */
export function getDb(): Promise<SQLiteDBConnection | null> {
  if (!isNativeApp()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  if (failedAt && Date.now() - failedAt < RETRY_COOLDOWN_MS) {
    return Promise.resolve(null);
  }

  dbStatus.state = "opening";
  dbPromise = withTimeout(openConnection(), OPEN_TIMEOUT_MS, "opening local database")
    .then((db) => {
      dbStatus.state = "open";
      dbStatus.error = null;
      failedAt = 0;
      return db as SQLiteDBConnection | null;
    })
    .catch((error) => {
      dbStatus.state = "failed";
      dbStatus.error = describeError(error);
      failedAt = Date.now();
      console.error("[offline-db] failed to open local database", error);
      dbPromise = null;
      return null;
    });
  return dbPromise;
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs database work one task at a time. The plugin wraps each statement in
 * its own transaction, and overlapping calls (cache writes racing outbox
 * writes) can otherwise collide.
 */
export function runSerialized<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

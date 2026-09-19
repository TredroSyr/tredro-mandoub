import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

const DB_NAME = "tredro_mandoub";
const DB_VERSION = 1;

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

let connection: SQLiteConnection | null = null;
let dbPromise: Promise<SQLiteDBConnection | null> | null = null;

/**
 * True only inside the native Capacitor shell (Android/iOS). On plain `next
 * dev` in a browser there is no native SQLite bridge, and wiring up the
 * jeep-sqlite/sql.js web fallback is out of scope for now — every function
 * in this module simply no-ops on web, so local dev keeps working exactly
 * as it did before this file existed, just without persistence.
 */
function isNativePlatform(): boolean {
  return Capacitor.getPlatform() !== "web";
}

async function openConnection(): Promise<SQLiteDBConnection | null> {
  if (!isNativePlatform()) return null;

  if (!connection) connection = new SQLiteConnection(CapacitorSQLite);

  const alreadyOpen = (await connection.isConnection(DB_NAME, false)).result;
  const db = alreadyOpen
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

/** Lazily opens (once) and returns the shared connection; null on web. */
export function getDb(): Promise<SQLiteDBConnection | null> {
  if (!dbPromise) dbPromise = openConnection();
  return dbPromise;
}

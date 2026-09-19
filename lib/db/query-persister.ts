import type { Persister } from "@tanstack/react-query-persist-client";
import { getDb } from "./sqlite";

const CACHE_KEY = "react-query-cache";

/**
 * Backs React Query's persistQueryClient with the same local SQLite database
 * as the outbox, so cached reads (customers, invoices, ...) survive the app
 * being fully killed while offline — not just backgrounded. A no-op on web
 * (see lib/db/sqlite.ts): `next dev` in a browser keeps working exactly as
 * before, just without persistence across a reload.
 */
export const sqlitePersister: Persister = {
  async persistClient(persistedClient) {
    const db = await getDb();
    if (!db) return;
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO query_cache (cache_key, data, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      [CACHE_KEY, JSON.stringify(persistedClient), now],
    );
  },

  async restoreClient() {
    const db = await getDb();
    if (!db) return undefined;
    const result = await db.query(
      "SELECT data FROM query_cache WHERE cache_key = ?",
      [CACHE_KEY],
    );
    const row = (result.values ?? [])[0] as { data: string } | undefined;
    if (!row) return undefined;
    try {
      return JSON.parse(row.data);
    } catch {
      // Corrupt/foreign row — treat as "nothing to restore" rather than throw.
      return undefined;
    }
  },

  async removeClient() {
    const db = await getDb();
    if (!db) return;
    await db.run("DELETE FROM query_cache WHERE cache_key = ?", [CACHE_KEY]);
  },
};

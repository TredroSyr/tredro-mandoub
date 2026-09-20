import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { clearSyncLog } from "@/lib/sync/sync-log";
import { describeError, getDb, runSerialized } from "./sqlite";

const CACHE_KEY = "react-query-cache";
const LS_KEY = "tredro_query_cache_v1";
const RESTORE_TIMEOUT_MS = 4000;
// The cache changes on nearly every query event; write it once things settle
// instead of re-serialising the whole thing on each one.
const SAVE_DEBOUNCE_MS = 1500;

/** What the persister last did — read by the diagnostics screen. */
export const cacheStatus: {
  lastSaveAt: number | null;
  lastSaveBytes: number | null;
  lastSaveTarget: "sqlite" | "localStorage" | null;
  lastSaveError: string | null;
  lastRestore: {
    at: number;
    source: "sqlite" | "localStorage" | "none";
    queries: number;
    error: string | null;
  } | null;
} = {
  lastSaveAt: null,
  lastSaveBytes: null,
  lastSaveTarget: null,
  lastSaveError: null,
  lastRestore: null,
};

async function writeToStores(json: string) {
  const db = await getDb();
  if (db) {
    try {
      const now = new Date().toISOString();
      await runSerialized(() =>
        db.run(
          `INSERT INTO query_cache (cache_key, data, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(cache_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
          [CACHE_KEY, json, now],
        ),
      );
      cacheStatus.lastSaveTarget = "sqlite";
      cacheStatus.lastSaveError = null;
      return;
    } catch (error) {
      cacheStatus.lastSaveError = describeError(error);
      console.error("[offline-db] SQLite cache write failed", cacheStatus.lastSaveError);
    }
  }
  try {
    window.localStorage.setItem(LS_KEY, json);
    cacheStatus.lastSaveTarget = "localStorage";
  } catch (error) {
    cacheStatus.lastSaveError = describeError(error);
    console.error("[offline-db] localStorage cache write failed", cacheStatus.lastSaveError);
  }
}

async function readFromSqlite(): Promise<PersistedClient | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  return runSerialized(async () => {
    const result = await db.query(
      "SELECT data FROM query_cache WHERE cache_key = ?",
      [CACHE_KEY],
    );
    const row = (result.values ?? [])[0] as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as PersistedClient) : undefined;
  });
}

function readFromLocalStorage(): PersistedClient | undefined {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PersistedClient) : undefined;
  } catch {
    return undefined;
  }
}

let pending: PersistedClient | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Backs React Query's persistence with the local SQLite database, falling
 * back to localStorage if SQLite can't be used on the device. Only ever
 * active in the native app (the provider isn't mounted on web).
 */
export const sqlitePersister: Persister = {
  persistClient(persistedClient) {
    pending = persistedClient;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const client = pending;
      pending = null;
      if (!client) return;
      const json = JSON.stringify(client);
      cacheStatus.lastSaveAt = Date.now();
      cacheStatus.lastSaveBytes = json.length;
      void writeToStores(json);
    }, SAVE_DEBOUNCE_MS);
  },

  async restoreClient() {
    // Queries wait for this to settle before they fetch (see
    // PersistQueryClientProvider), so it must never hang or throw — a stuck
    // database would otherwise freeze every screen on its loading state.
    const restore = async () => {
      let source: "sqlite" | "localStorage" | "none" = "none";
      let client: PersistedClient | undefined;
      let error: string | null = null;
      try {
        client = await readFromSqlite();
        if (client) source = "sqlite";
      } catch (e) {
        error = describeError(e);
        console.error("[offline-db] SQLite cache read failed", error);
      }
      if (!client) {
        client = readFromLocalStorage();
        if (client) source = "localStorage";
      }
      cacheStatus.lastRestore = {
        at: Date.now(),
        source,
        queries: client?.clientState?.queries?.length ?? 0,
        error,
      };
      return client;
    };
    const timeout = new Promise<undefined>((resolve) =>
      setTimeout(() => {
        cacheStatus.lastRestore = {
          at: Date.now(),
          source: "none",
          queries: 0,
          error: `restore timed out after ${RESTORE_TIMEOUT_MS}ms`,
        };
        resolve(undefined);
      }, RESTORE_TIMEOUT_MS),
    );
    try {
      return await Promise.race([restore(), timeout]);
    } catch (error) {
      console.error("[offline-db] failed to restore cached data", error);
      return undefined;
    }
  },

  async removeClient() {
    pending = null;
    if (timer) clearTimeout(timer);
    timer = null;
    try {
      window.localStorage.removeItem(LS_KEY);
    } catch {}
    const db = await getDb();
    if (!db) return;
    try {
      await runSerialized(() =>
        db.run("DELETE FROM query_cache WHERE cache_key = ?", [CACHE_KEY]),
      );
    } catch (error) {
      console.error("[offline-db] failed to clear cached data", describeError(error));
    }
  },
};

/**
 * Wipes the cached reads on this device. Called on every sign-out so the
 * next rep to sign in never sees the previous rep's customers or invoices.
 * (The outbox is deliberately NOT cleared: unsynced writes must survive.)
 */
export async function clearOfflineCache(): Promise<void> {
  clearSyncLog();
  await sqlitePersister.removeClient();
}

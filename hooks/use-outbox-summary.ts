"use client";

import { useCallback, useEffect, useState } from "react";
import { listOutboxItems, type OutboxItem } from "@/lib/db/outbox";

/**
 * Polls the outbox table for pending/syncing/failed items. The SQLite plugin
 * has no live-query subscription, so this re-reads on an interval; callers
 * that just changed the table themselves (retry, discard) should call
 * `refresh()` directly instead of waiting for the next tick.
 */
export function useOutboxSummary(pollMs = 5000) {
  const [items, setItems] = useState<OutboxItem[]>([]);

  const refresh = useCallback(() => {
    listOutboxItems().then(setItems);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollMs);
    return () => clearInterval(interval);
  }, [refresh, pollMs]);

  const failedCount = items.filter((i) => i.status === "failed").length;
  const pendingCount = items.length - failedCount;

  return { items, pendingCount, failedCount, refresh };
}

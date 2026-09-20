import { useSyncExternalStore } from "react";
import {
  listOutboxItems,
  subscribeOutboxChanges,
  type OutboxItem,
} from "@/lib/db/outbox";
import { isNativeApp } from "@/lib/native";

/**
 * One shared, live copy of the outbox for the UI. Many cards can each ask
 * "is something waiting to sync for ME?" without each polling the database:
 * a single subscription refreshes this store whenever the outbox changes.
 */
const EMPTY: OutboxItem[] = [];
let snapshot: OutboxItem[] = EMPTY;
let signature = "";
const subscribers = new Set<() => void>();
let stop: (() => void) | null = null;

const signatureOf = (items: OutboxItem[]) =>
  items.map((i) => `${i.id}:${i.status}:${i.updatedAt}`).join("|");

async function refresh(): Promise<void> {
  const items = await listOutboxItems();
  const next = signatureOf(items);
  if (next === signature) return;
  signature = next;
  snapshot = items.length > 0 ? items : EMPTY;
  subscribers.forEach((notify) => notify());
}

function start(): void {
  void refresh();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const scheduleRefresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void refresh(), 150);
  };
  const unsubscribe = subscribeOutboxChanges(scheduleRefresh);
  // Safety net for anything that changed the outbox without going through us.
  const poll = setInterval(() => void refresh(), 10_000);
  stop = () => {
    clearTimeout(timer);
    unsubscribe();
    clearInterval(poll);
  };
}

function subscribe(notify: () => void): () => void {
  subscribers.add(notify);
  if (subscribers.size === 1 && isNativeApp()) start();
  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0) {
      stop?.();
      stop = null;
    }
  };
}

/** Every item currently in the outbox (pending, syncing and failed), live. */
export function useOutboxItems(): OutboxItem[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}

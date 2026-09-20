import { enqueueOutboxItem, removeOutboxItem } from "@/lib/db/outbox";
import { isNativeApp } from "@/lib/native";
import { OfflineQueuedError, isTransportFailure } from "./errors";

/**
 * Runs a write; if it fails with no server response, durably queues it in
 * the outbox and throws OfflineQueuedError. If it can't be queued (e.g. on
 * web, where there is no local database) the ORIGINAL error is rethrown —
 * never claim something was saved when it wasn't.
 *
 * `replaces` is the id of an outbox item the rep is editing: once this new
 * submission is accepted by the server — or safely re-queued — the old item
 * is deleted, so an edited retry never leaves the stale copy behind.
 */
export async function runOrQueue<T>(args: {
  id: string;
  kind: string;
  label: string;
  payload: unknown;
  run: () => Promise<T>;
  replaces?: string;
}): Promise<T> {
  // Web build: no offline mode, behave exactly like a plain request.
  if (!isNativeApp()) return args.run();

  try {
    const result = await args.run();
    if (args.replaces) await removeOutboxItem(args.replaces);
    return result;
  } catch (error) {
    if (isTransportFailure(error)) {
      let queued = false;
      try {
        queued = await enqueueOutboxItem({
          id: args.id,
          kind: args.kind,
          label: args.label,
          payload: args.payload,
        });
      } catch (dbError) {
        console.error("[offline] failed to queue write", dbError);
      }
      if (queued) {
        if (args.replaces && args.replaces !== args.id) {
          await removeOutboxItem(args.replaces);
        }
        throw new OfflineQueuedError();
      }
    }
    throw error;
  }
}

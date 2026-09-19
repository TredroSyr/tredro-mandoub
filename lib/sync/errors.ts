/**
 * Thrown by a mutation's mutationFn when a request fails with no server
 * response at all (offline / transport failure) and the write has already
 * been queued in the local outbox instead of being lost. The mutation's
 * onError should treat this as "queued, not failed" — a reassuring toast,
 * not an error state — since the rep's data is safely captured and will be
 * sent automatically once the outbox flushes on reconnect.
 */
export class OfflineQueuedError extends Error {
  constructor() {
    super("Queued for sync — no connection");
    this.name = "OfflineQueuedError";
  }
}

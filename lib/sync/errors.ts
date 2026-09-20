import axios from "axios";

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

export const QUEUED_MESSAGE =
  "لا يوجد اتصال — تم حفظ العملية وستُرسل تلقائيًا عند عودة الاتصال";

/**
 * True only when the request never got a server response (offline, DNS,
 * timeout/abort). A real 4xx/5xx rejection has `error.response` and must
 * surface as a normal error, never be queued.
 */
export function isTransportFailure(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

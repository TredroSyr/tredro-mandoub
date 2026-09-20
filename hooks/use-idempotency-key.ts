"use client";

import { useCallback, useRef } from "react";

/**
 * One Idempotency-Key per *logical operation*, not per hook instance.
 *
 * The same key is reused only when the exact same payload is submitted
 * again (a resubmit after a timeout or a double tap), so the server can
 * dedupe it. A different payload — or a new operation after the previous
 * one succeeded (`reset()`) — gets a fresh key. Reusing one key across
 * different operations (e.g. two different payments from the same dialog)
 * would make the server treat the second as a replay of the first.
 */
export function useIdempotencyKey() {
  const current = useRef<{ fingerprint: string; key: string } | null>(null);

  const keyFor = useCallback((payload: unknown) => {
    const fingerprint = JSON.stringify(payload);
    if (current.current?.fingerprint !== fingerprint) {
      current.current = { fingerprint, key: crypto.randomUUID() };
    }
    return current.current.key;
  }, []);

  const reset = useCallback(() => {
    current.current = null;
  }, []);

  return { keyFor, reset };
}

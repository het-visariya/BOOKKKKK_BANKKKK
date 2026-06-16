/**
 * Local REST backend hook — replaces ICP canister actor.
 * Returns the REST adapter immediately (no async canister initialization).
 */
import type { Backend } from "@/backend";
import { restBackend } from "@/lib/restBackend";

export function useAnonActor(): {
  actor: Backend | null;
  isFetching: boolean;
} {
  // #region agent log
  fetch("http://127.0.0.1:7755/ingest/02e5a082-ce85-4eb5-ba31-4f93cc4081d7", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "4ecbd1",
    },
    body: JSON.stringify({
      sessionId: "4ecbd1",
      runId: "pre-fix",
      hypothesisId: "C",
      location: "useAnonActor.ts",
      message: "useAnonActor returning REST backend",
      data: { hasActor: true, isFetching: false },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    actor: restBackend,
    isFetching: false,
  };
}

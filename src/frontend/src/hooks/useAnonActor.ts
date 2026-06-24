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
  const INGEST_URL =
    (import.meta.env.VITE_INGEST_URL as string | undefined)?.replace(/\/$/, "") || "";

  if (INGEST_URL) {
    fetch(`${INGEST_URL}/ingest/02e5a082-ce85-4eb5-ba31-4f93cc4081d7`, {
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
  }

  return {
    actor: restBackend,
    isFetching: false,
  };
}

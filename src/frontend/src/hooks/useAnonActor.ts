/**
 * Lightweight compatibility hook that exposes the REST backend.
 * The app uses this adapter directly so no actor or canister runtime is needed.
 */
import type { Backend } from "@/backend";
import { restBackend } from "@/lib/restBackend";

export function useAnonActor(): {
  actor: Backend | null;
  isFetching: boolean;
} {
  return {
    actor: restBackend as Backend,
    isFetching: false,
  };
}

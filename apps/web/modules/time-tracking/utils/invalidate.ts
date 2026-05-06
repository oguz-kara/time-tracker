import type { QueryClient } from "@tanstack/react-query";

/**
 * Query-key prefixes owned by the time-tracking + user-settings domains.
 * Centralized so a mutation can invalidate just our own queries instead of
 * `qc.invalidateQueries()` which nukes the entire cache (auth, billing, etc).
 */
const TIME_TRACKING_KEY_PREFIXES = [
  "GetCurrentEntry",
  "GetEntries",
  "GetDailyTotals",
  "GetUserSettings",
] as const;

/**
 * Invalidate all time-tracking + user-settings queries. Used after Start/Stop,
 * createEntry, updateEntry, deleteEntry, updateUserSettings — any mutation
 * whose effect could change what these queries return.
 */
export function invalidateTimeTrackingQueries(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({
    predicate: (query) => {
      const first = query.queryKey[0];
      return (
        typeof first === "string" &&
        (TIME_TRACKING_KEY_PREFIXES as readonly string[]).includes(first)
      );
    },
  });
}

import type { QueryClient } from "@tanstack/react-query";

/**
 * Query-key prefixes owned by the habits domain. Mirrors
 * time-tracking/utils/invalidate.ts — mutations invalidate only our own
 * queries instead of nuking the whole cache.
 */
const HABITS_KEY_PREFIXES = [
  "GetHabits",
  "GetBacklogForPlanning",
  "GetDailyChecklist",
  "GetActiveSprint",
  "GetCompletedSprints",
  "GetHabitChecks",
] as const;

export function invalidateHabitsQueries(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({
    predicate: (query) => {
      const first = query.queryKey[0];
      return (
        typeof first === "string" &&
        (HABITS_KEY_PREFIXES as readonly string[]).includes(first)
      );
    },
  });
}

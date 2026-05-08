export interface DayBreakdown {
  /** First entry's start, or null if no entries. */
  workdayStart: Date | null;
  /** Last entry's stop, or `now` if a running entry exists, or null if no entries. */
  workdayEnd: Date | null;
  /** Total ms inside [workdayStart, workdayEnd] (the "psychological" workday). */
  windowMs: number;
  /** Sum of (stop ?? now) - start for all entries. */
  workedMs: number;
  /** windowMs - workedMs. The mola. Always ≥ 0. */
  breakMs: number;
  /** True iff at least one entry is still running (stop is null). */
  isLive: boolean;
}

interface EntryLike {
  start?: Date | string | null;
  stop?: Date | string | null;
}

/**
 * Given a day's entries and a "now" reference, compute the workday breakdown:
 *
 *   workday window = first entry's start → last entry's stop (or now() if running)
 *   worked         = sum of entry durations
 *   break          = window - worked
 *
 * Pure function. Time-zone agnostic — caller is responsible for filtering
 * `entries` to a single day already.
 */
export function computeDayBreakdown(
  entries: EntryLike[],
  now: Date
): DayBreakdown {
  const nowMs = now.getTime();
  let earliestStartMs = Number.POSITIVE_INFINITY;
  let latestEndMs = 0;
  let workedMs = 0;
  let isLive = false;
  let counted = 0;

  for (const e of entries) {
    if (!e.start) continue;
    const startMs = new Date(e.start).getTime();
    const stopMs = e.stop ? new Date(e.stop).getTime() : nowMs;

    if (startMs < earliestStartMs) earliestStartMs = startMs;
    if (stopMs > latestEndMs) latestEndMs = stopMs;
    workedMs += Math.max(0, stopMs - startMs);

    if (!e.stop) isLive = true;
    counted++;
  }

  if (counted === 0) {
    return {
      workdayStart: null,
      workdayEnd: null,
      windowMs: 0,
      workedMs: 0,
      breakMs: 0,
      isLive: false,
    };
  }

  const windowMs = Math.max(0, latestEndMs - earliestStartMs);
  // Clamp break to ≥ 0 — defends against minor clock skew where worked
  // sums can drift slightly past the window due to floating point.
  const breakMs = Math.max(0, windowMs - workedMs);

  return {
    workdayStart: new Date(earliestStartMs),
    workdayEnd: new Date(latestEndMs),
    windowMs,
    workedMs,
    breakMs,
    isLive,
  };
}

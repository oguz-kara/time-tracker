export interface DayBucket {
  /** YYYY-MM-DD in the user's tz. */
  date: string;
  totalMinutes: number;
}

interface EntryLike {
  start?: string | Date | null;
  stop?: string | Date | null;
  tags?: readonly (string | null)[] | null;
}

/**
 * Bucket entries into daily totals in the user's tz, matching the
 * server-side `getDailyTotals` semantics:
 *
 *   - Each entry's duration is clamped to `[from, to)`:
 *       LEAST(stop ?? now, to) - GREATEST(start, from)
 *   - The bucket key is the calendar day of `start` in `timezone`.
 *   - `dateList` is the full window (one entry per calendar day in tz)
 *     so the output array is zero-filled and ready for charting.
 *
 * If `tag` is provided, only entries containing that tag contribute.
 * If `tag` is null/undefined, every entry contributes.
 *
 * Pure function — no React, no queries — fully unit-testable.
 */
export function bucketByDay(
  entries: EntryLike[],
  from: Date,
  to: Date,
  dateList: string[],
  timezone: string,
  tag: string | null = null
): DayBucket[] {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const fromMs = from.getTime();
  const toMs = to.getTime();
  const nowMs = Date.now();

  const byDate = new Map<string, number>();

  for (const e of entries) {
    if (!e?.start) continue;
    if (tag && !(e.tags ?? []).includes(tag)) continue;

    const startMs = new Date(e.start).getTime();
    const stopMs = e.stop ? new Date(e.stop).getTime() : nowMs;

    // Same clamping math as the SQL LEAST/COALESCE/GREATEST.
    const clampedStart = Math.max(startMs, fromMs);
    const clampedStop = Math.min(stopMs, toMs);
    const minutes = (clampedStop - clampedStart) / 60_000;
    if (minutes <= 0) continue;

    // Bucket by the entry's start day in tz. Matches getDailyTotals'
    // `date_trunc('day', "start" AT TIME ZONE tz)` exactly.
    const key = fmt.format(new Date(startMs));
    byDate.set(key, (byDate.get(key) ?? 0) + minutes);
  }

  return dateList.map((date) => ({
    date,
    totalMinutes: Math.round(byDate.get(date) ?? 0),
  }));
}

/**
 * Build the inclusive list of YYYY-MM-DD calendar-day keys (in `tz`) for the
 * `[from, to)` window. Useful for zero-filling daily charts.
 */
export function buildDateList(
  from: Date,
  to: Date,
  timezone: string
): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const out: string[] = [];
  // Walk in 24h steps; for any reasonable window (≤31 days) this is fine
  // and immune to DST since we re-format each instant in tz.
  for (
    let t = from.getTime();
    t < to.getTime();
    t += 24 * 60 * 60 * 1000
  ) {
    out.push(fmt.format(new Date(t)));
  }
  return out;
}

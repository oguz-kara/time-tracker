/**
 * Mock daily-totals dataset for previewing charts before real data exists.
 *
 * Toggle: set NEXT_PUBLIC_USE_MOCK_TIME_DATA=1 in apps/web/.env, or flip the
 * literal flag below for a quick local check. The mock window covers the
 * last 90 days ending today (in the user's tz), filtering down to whatever
 * range a chart asks for.
 *
 * Generation is deterministic per-day (seeded by the date string), so
 * reloads don't reshuffle the bars and the streak/stats are stable.
 */

import type { DailyTotal, TimeEntry } from "../types";
import { wallClockInTzToUtc } from "../utils/format";

export const USE_MOCK_TIME_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_TIME_DATA === "1" || false;

const WINDOW_DAYS = 90;

/** Cheap deterministic hash → number in [0, 1). */
function seeded(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Convert to unsigned and normalize
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

/** YYYY-MM-DD in tz for the date `daysAgo` days before today. */
function dateKey(daysAgo: number, tz: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000));
}

// `wallClockInTzToUtc` lives in utils/format.ts so dayRange and the mock
// layer share one DST-safe implementation. Imported below.

/**
 * Fake daily-totals series shaped to look like a realistic working pattern:
 * - Weekdays target ~7.5h ± noise; weekends mostly empty with occasional bursts
 * - Roughly one third of weekdays "miss the goal" (4-7h)
 * - Occasional zero days (sick, off, traveling)
 */
function generate(tz: string): DailyTotal[] {
  const today = dateKey(0, tz);
  const out: DailyTotal[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const date = dateKey(i, tz);
    const isToday = date === today;
    // Day-of-week from the date string itself
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
    const weekend = dow === 0 || dow === 6;

    const r1 = seeded(date);
    const r2 = seeded(`${date}#2`);
    const r3 = seeded(`${date}#3`);

    let minutes: number;
    if (isToday) {
      // Always populate today so the chart has something to show.
      // Mid-range workday: 5h-7.5h.
      minutes = Math.round(300 + r3 * 150);
    } else if (weekend) {
      // Mostly off, sometimes a 1-3h burst
      minutes = r1 < 0.7 ? 0 : Math.round(60 + r2 * 120);
    } else if (r1 < 0.05) {
      // Sick/off
      minutes = 0;
    } else if (r1 < 0.35) {
      // Under-goal weekday: 3-7h
      minutes = Math.round(180 + r2 * 240);
    } else {
      // On/over-goal weekday: 7h-9.5h
      minutes = Math.round(420 + r3 * 150);
    }

    out.push({ date, totalMinutes: minutes });
  }
  return out;
}

const cache = new Map<string, DailyTotal[]>();

function getSeries(tz: string): DailyTotal[] {
  const cached = cache.get(tz);
  if (cached) return cached;
  const fresh = generate(tz);
  cache.set(tz, fresh);
  return fresh;
}

/**
 * Filter the mock series to a `[from, to)` window, matching how the GraphQL
 * dailyTotals resolver returns rows. Days with 0 minutes are omitted —
 * the real resolver only returns days that have entries, and the chart code
 * already fills in zeros for missing dates.
 */
export function getMockDailyTotals(
  from: Date,
  to: Date,
  tz: string
): DailyTotal[] {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  return getSeries(tz)
    .filter((row) => {
      // Compare on YYYY-MM-DD parsed as UTC midnight, same approach as the chart code
      const d = new Date(`${row.date}T00:00:00Z`).getTime();
      return d >= fromMs && d < toMs;
    })
    .filter((row) => row.totalMinutes > 0);
}

/**
 * Mock entries for a given day — splits the day's total minutes into 2-4
 * realistic-looking sessions (morning block, lunch gap, afternoon block).
 * Entries fall between 09:00 and 19:00 in the user's tz.
 *
 * Returns rows shaped like the GraphQL TimeEntry: dates as ISO strings.
 */
export function getMockEntriesForDay(
  date: string,
  tz: string,
  totalMinutes: number
): TimeEntry[] {
  if (totalMinutes <= 0) return [];

  // Build a UTC Date that represents 09:00 in `tz` on `date`.
  // We do it by binary-searching for the UTC instant whose Intl rendering
  // in `tz` matches the desired wall-clock — handles DST cleanly.
  const dayStartUtc = wallClockInTzToUtc(date, 9, 0, tz);

  const r1 = seeded(`${date}@e1`);
  const r2 = seeded(`${date}@e2`);
  const r3 = seeded(`${date}@e3`);

  // Split total into 2–3 chunks; lunch-ish gap between them
  const numChunks = totalMinutes < 240 ? 2 : 3;
  const splits =
    numChunks === 2
      ? [0.55 + r1 * 0.1, 0.45 - r1 * 0.1]
      : [0.4 + r1 * 0.1, 0.25 + r2 * 0.1, 0.35 - (r1 + r2) * 0.1];

  const descriptions = ["deep work", "meeting", "email", "review", "focus block"];
  const tagPool = ["coding", "meeting", "review", "email", "deep-work"];

  const out: TimeEntry[] = [];
  let cursorMs = dayStartUtc.getTime();

  splits.forEach((frac, idx) => {
    const dur = Math.max(15, Math.round(totalMinutes * frac));
    const start = new Date(cursorMs);
    const stop = new Date(cursorMs + dur * 60_000);

    // Gap between chunks (15-90 min, lunch-sized for the middle gap)
    const gapMin = idx === 0 ? Math.round(30 + r2 * 60) : Math.round(15 + r3 * 30);

    // 1-2 deterministic tags per session, drawn from the pool. Same `date+idx`
    // always yields the same tags so reloads don't shuffle.
    const ti1 = Math.floor(seeded(`${date}@t1${idx}`) * tagPool.length);
    const ti2 = Math.floor(seeded(`${date}@t2${idx}`) * tagPool.length);
    const tags =
      ti1 === ti2 ? [tagPool[ti1]!] : [tagPool[ti1]!, tagPool[ti2]!];

    out.push({
      id: `mock-${date}-${idx}`,
      userId: "mock",
      organizationId: "mock",
      start,
      stop,
      description: descriptions[idx % descriptions.length] || null,
      tags,
      createdAt: start,
      updatedAt: stop,
    });

    cursorMs = stop.getTime() + gapMin * 60_000;
  });

  return out;
}

/** Distinct tags used by the mock dataset, sorted. */
export function getMockUserTags(): string[] {
  return ["coding", "deep-work", "email", "meeting", "review"];
}

/** All mock entries within `[from, to)`. */
export function getMockEntries(
  from: Date,
  to: Date,
  tz: string
): TimeEntry[] {
  const series = getSeries(tz);
  const fromMs = from.getTime();
  const toMs = to.getTime();
  const out: TimeEntry[] = [];
  for (const row of series) {
    if (row.totalMinutes <= 0) continue;
    const dayMs = new Date(`${row.date}T00:00:00Z`).getTime();
    // Day touches the window?
    if (dayMs + 24 * 60 * 60 * 1000 < fromMs) continue;
    if (dayMs >= toMs) continue;
    for (const e of getMockEntriesForDay(row.date, tz, row.totalMinutes)) {
      const s = new Date(e.start).getTime();
      if (s >= fromMs && s < toMs) out.push(e);
    }
  }
  return out;
}

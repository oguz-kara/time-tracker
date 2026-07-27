import { addDays, diffDays, weekStartKey } from "./dates";

/**
 * Pure scoring logic for habits. No DB, no React — fully unit-tested.
 * All date params are YYYY-MM-DD keys in the user's timezone.
 */

export interface ScoringHabit {
  type: "good" | "bad";
  frequency: "daily" | "weekly";
  timesPerWeek: number | null;
}

export interface CheckLike {
  date: string;
  kind: "done" | "slip";
  count: number;
}

const STREAK_SAFETY_CAP = 3650;

/** Consecutive done-days ending today or yesterday. */
export function computeDailyStreak(doneDates: ReadonlySet<string>, today: string): number {
  let cursor = doneDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (doneDates.has(cursor) && streak < STREAK_SAFETY_CAP) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Consecutive weeks meeting `timesPerWeek`, walking back from the previous
 * week. The current week joins the streak once its own quota is met.
 */
export function computeWeeklyStreak(
  doneDates: readonly string[],
  today: string,
  timesPerWeek: number,
  weekStartsOn: 0 | 1
): { weeks: number; thisWeekCount: number } {
  const byWeek = new Map<string, number>();
  for (const d of new Set(doneDates)) {
    const wk = weekStartKey(d, weekStartsOn);
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1);
  }
  const currentWeek = weekStartKey(today, weekStartsOn);
  const thisWeekCount = byWeek.get(currentWeek) ?? 0;

  let weeks = thisWeekCount >= timesPerWeek ? 1 : 0;
  let cursor = addDays(currentWeek, -7);
  while ((byWeek.get(cursor) ?? 0) >= timesPerWeek && weeks < STREAK_SAFETY_CAP) {
    weeks++;
    cursor = addDays(cursor, -7);
  }
  return { weeks, thisWeekCount };
}

/** Days since the last slip; falls back to tracking start when clean forever. */
export function computeDaysClean(
  slipDates: readonly string[],
  trackingStart: string,
  today: string
): number {
  if (slipDates.length === 0) return Math.max(0, diffDays(today, trackingStart));
  const last = [...slipDates].sort().at(-1)!;
  return Math.max(0, diffDays(today, last));
}

/** Inclusive elapsed days of [startKey..endKey], clamped at `today`. */
function elapsedDays(startKey: string, endKey: string, today: string): number {
  const effectiveEnd = today < endKey ? today : endKey;
  return Math.max(0, diffDays(effectiveEnd, startKey) + 1);
}

function inWindow(date: string, startKey: string, endKey: string, today: string): boolean {
  const effectiveEnd = today < endKey ? today : endKey;
  return date >= startKey && date <= effectiveEnd;
}

/**
 * Sprint-window completion percentage (0–100 int).
 * Good daily: doneDays/elapsed. Good weekly: doneDays/(tpw × elapsed/7).
 * Bad: cleanDays/elapsed. Checks outside the clamped window are ignored.
 */
export function completionPct(
  habit: ScoringHabit,
  checks: readonly CheckLike[],
  startKey: string,
  endKey: string,
  today: string
): number {
  const elapsed = elapsedDays(startKey, endKey, today);
  if (elapsed <= 0) return 0;

  const windowed = checks.filter((c) => inWindow(c.date, startKey, endKey, today));

  if (habit.type === "bad") {
    const slipDays = new Set(windowed.filter((c) => c.kind === "slip").map((c) => c.date)).size;
    return Math.round(((elapsed - slipDays) / elapsed) * 100);
  }

  const doneDays = new Set(windowed.filter((c) => c.kind === "done").map((c) => c.date)).size;
  const expected =
    habit.frequency === "weekly" && habit.timesPerWeek
      ? (habit.timesPerWeek * elapsed) / 7
      : elapsed;
  if (expected <= 0) return 0;
  return Math.min(100, Math.round((doneDays / expected) * 100));
}

/**
 * Established-decay flag.
 * Daily: no done within [today-2 .. today]. Weekly: previous week's quota
 * missed. Bad: slip counts summing ≥ 2 within [today-6 .. today].
 */
export function needsAttention(
  habit: ScoringHabit,
  checks: readonly CheckLike[],
  today: string,
  weekStartsOn: 0 | 1
): boolean {
  if (habit.type === "bad") {
    const floor = addDays(today, -6);
    const slips = checks
      .filter((c) => c.kind === "slip" && c.date >= floor && c.date <= today)
      .reduce((acc, c) => acc + c.count, 0);
    return slips >= 2;
  }
  if (habit.frequency === "weekly" && habit.timesPerWeek) {
    const prevWeekStart = addDays(weekStartKey(today, weekStartsOn), -7);
    const prevWeekEnd = addDays(prevWeekStart, 6);
    const count = new Set(
      checks
        .filter((c) => c.kind === "done" && c.date >= prevWeekStart && c.date <= prevWeekEnd)
        .map((c) => c.date)
    ).size;
    return count < habit.timesPerWeek;
  }
  const floor = addDays(today, -2);
  return !checks.some((c) => c.kind === "done" && c.date >= floor && c.date <= today);
}

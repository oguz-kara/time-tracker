/**
 * Pure date-key arithmetic on YYYY-MM-DD strings.
 *
 * All keys are calendar days in the *user's* timezone (en-CA formatting, the
 * repo-wide convention — see time-tracking/utils/format.ts). Arithmetic is
 * done at UTC noon so DST transitions can never shift the calendar day.
 */

export function dateKeyInTz(instant: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function todayKey(timezone: string): string {
  return dateKeyInTz(new Date(), timezone);
}

export function addDays(key: string, delta: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Signed whole-day difference `a - b`. */
export function diffDays(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86_400_000
  );
}

/** The key of the first day of the week containing `key`. */
export function weekStartKey(key: string, weekStartsOn: 0 | 1): string {
  const dayOfWeek = new Date(`${key}T12:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  const diff = (dayOfWeek - weekStartsOn + 7) % 7;
  return addDays(key, -diff);
}

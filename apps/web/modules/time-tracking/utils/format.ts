/**
 * Format a duration in minutes as "Xh Ym" (or "Xm" if < 60).
 * Negative values are clamped to 0.
 */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

/**
 * Format milliseconds as "HH:MM:SS" (live timer display).
 */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Format a Date as "HH:MM" in the given IANA timezone.
 */
export function formatTimeOfDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  const tzString = date.toLocaleString("en-US", { timeZone: timezone });
  const utcString = date.toLocaleString("en-US", { timeZone: "UTC" });
  return (new Date(utcString).getTime() - new Date(tzString).getTime()) / 60_000;
}

/**
 * Convert a wall-clock moment in `tz` (e.g. "2026-05-02 09:00 in Europe/Istanbul")
 * to the corresponding UTC Date. DST-safe: reads the tz offset *for that
 * specific instant* via Intl rather than guessing.
 *
 * Used by `dayRange` (midnight bounds) and the mock layer (entry start times).
 * Public so both can share — keeps tz arithmetic in one place.
 */
export function wallClockInTzToUtc(
  date: string,
  hour: number,
  minute: number,
  tz: string
): Date {
  // First pass: interpret the wall clock as if it were UTC. This gives a
  // candidate UTC instant that is wrong by exactly the tz offset.
  const pad = (n: number) => n.toString().padStart(2, "0");
  const candidate = new Date(`${date}T${pad(hour)}:${pad(minute)}:00Z`);

  // Second pass: ask Intl what wall clock that candidate UTC instant
  // corresponds to in `tz`, then compute the offset from desired wall clock.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(candidate);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const tzAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  const offsetMs = tzAsUtc - candidate.getTime();

  // Subtract the offset to get the UTC instant whose tz wall clock is exactly desired.
  return new Date(candidate.getTime() - offsetMs);
}

/**
 * Compute the [from, to) range for any calendar day in the user's timezone,
 * returned as UTC Dates suitable for SQL params.
 *
 * `date` is interpreted as "the calendar day this Date falls on, in `timezone`."
 * The time-of-day on `date` is ignored.
 */
export function dayRange(
  date: Date,
  timezone: string
): { from: Date; to: Date } {
  // Extract the calendar Y-M-D string in the user's tz first. This is the
  // only piece of information we want from `date`; its time-of-day and the
  // browser's local tz are irrelevant.
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  // Anchor "midnight in `timezone` on `dateKey`" as a real UTC instant via
  // the DST-safe wall-clock conversion. Older versions of this function
  // parsed the YYYY-MM-DD string as browser-local, which produced wrong
  // windows when the server (or developer's machine) was in a tz different
  // from the user's configured tz.
  const from = wallClockInTzToUtc(dateKey, 0, 0, timezone);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

/**
 * [from, to) range for today in the user's timezone.
 * Thin wrapper around `dayRange(new Date(), tz)` — kept for explicit intent
 * at call sites that always mean "today."
 */
export function todayRange(timezone: string): { from: Date; to: Date } {
  return dayRange(new Date(), timezone);
}

/** Granularity options for `periodRange`. Week and month for v1. */
export type Granularity = "week" | "month";

// Map IANA weekday short name to JS day index (0=Sun..6=Sat).
const WEEKDAY_TO_IDX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Week range containing `anchor` in `timezone`, with `weekStartsOn` defining
 * the first day of the week (0=Sun, 1=Mon).
 *
 * IMPORTANT: day-of-week is computed in the user's tz, not from the UTC
 * instant of "tz-local midnight." Calling `getUTCDay()` on the latter would
 * land on the previous calendar day for east-of-UTC zones (e.g. Istanbul
 * Mon-midnight is Sun 21:00 UTC) and produce a week shifted by one day.
 */
function weekRangeFor(
  anchor: Date,
  timezone: string,
  weekStartsOn: 0 | 1
): { from: Date; to: Date } {
  const { from: anchorDayFrom } = dayRange(anchor, timezone);
  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(anchor);
  const dayOfWeek = WEEKDAY_TO_IDX[weekdayShort] ?? 0;
  const diff = (dayOfWeek - weekStartsOn + 7) % 7;
  const from = new Date(anchorDayFrom.getTime() - diff * 24 * 60 * 60 * 1000);
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from, to };
}

/**
 * Month range containing `anchor` in `timezone`. Uses `wallClockInTzToUtc`
 * for the boundary instants, which is DST-safe even at month edges.
 */
function monthRangeFor(
  anchor: Date,
  timezone: string
): { from: Date; to: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(anchor);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);

  const from = wallClockInTzToUtc(
    `${y}-${String(m).padStart(2, "0")}-01`,
    0,
    0,
    timezone
  );
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const to = wallClockInTzToUtc(
    `${next.y}-${String(next.m).padStart(2, "0")}-01`,
    0,
    0,
    timezone
  );
  return { from, to };
}

/**
 * [from, to) range for the period containing `anchor`. The dashboard uses
 * this for navigable week/month windows; `weekRange`/`monthRange` are thin
 * wrappers for "the current period" callers.
 */
export function periodRange(
  granularity: Granularity,
  anchor: Date,
  timezone: string,
  weekStartsOn: 0 | 1
): { from: Date; to: Date } {
  return granularity === "month"
    ? monthRangeFor(anchor, timezone)
    : weekRangeFor(anchor, timezone, weekStartsOn);
}

/** Range for the current week, anchored to `weekStartsOn` (0=Sun, 1=Mon). */
export function weekRange(
  timezone: string,
  weekStartsOn: 0 | 1
): { from: Date; to: Date } {
  return weekRangeFor(new Date(), timezone, weekStartsOn);
}

/** Range for the current month in the user's tz. */
export function monthRange(timezone: string): { from: Date; to: Date } {
  return monthRangeFor(new Date(), timezone);
}

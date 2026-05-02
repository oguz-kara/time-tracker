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
 * Compute today's [from, to) range in the user's timezone, as UTC Dates
 * suitable for SQL params.
 */
export function todayRange(timezone: string): { from: Date; to: Date } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  const localMidnight = new Date(`${y}-${m}-${d}T00:00:00`);
  const offsetMinutes = getTimezoneOffsetMinutes(localMidnight, timezone);
  const from = new Date(localMidnight.getTime() - offsetMinutes * 60_000);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

/**
 * Range for the current week, anchored to weekStartsOn (0=Sun, 1=Mon).
 */
export function weekRange(timezone: string, weekStartsOn: 0 | 1): { from: Date; to: Date } {
  const { from: todayFrom } = todayRange(timezone);
  const dayOfWeek = todayFrom.getUTCDay();
  const diff = (dayOfWeek - weekStartsOn + 7) % 7;
  const from = new Date(todayFrom.getTime() - diff * 24 * 60 * 60 * 1000);
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from, to };
}

/**
 * Range for the current month in the user's tz.
 */
export function monthRange(timezone: string): { from: Date; to: Date } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const firstLocal = new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00`);
  const offsetMinutes = getTimezoneOffsetMinutes(firstLocal, timezone);
  const from = new Date(firstLocal.getTime() - offsetMinutes * 60_000);
  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const nextFirstLocal = new Date(
    `${nextMonth.y}-${String(nextMonth.m).padStart(2, "0")}-01T00:00:00`
  );
  const nextOffset = getTimezoneOffsetMinutes(nextFirstLocal, timezone);
  const to = new Date(nextFirstLocal.getTime() - nextOffset * 60_000);
  return { from, to };
}

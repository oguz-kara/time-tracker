"use client";

import {
  useGetDailyTotalsQuery,
  useGetUserSettingsQuery,
} from "@/lib/graphql/generated";
import {
  todayRange,
  weekRange,
  monthRange,
  formatMinutes,
} from "../utils/format";
import { USE_MOCK_TIME_DATA, getMockDailyTotals } from "../mocks/daily-totals";
import { useUserTimezone } from "../hooks/useUserTimezone";
import { useTranslations } from "next-intl";

interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-medium tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

export function StatsStrip() {
  const t = useTranslations("dashboard.stats");
  const { data: settingsData } = useGetUserSettingsQuery();
  const tz = useUserTimezone();
  const goal = settingsData?.userSettings?.dailyGoalMinutes ?? 480;
  const weekStartsOn = (settingsData?.userSettings?.weekStartsOn ?? 1) as 0 | 1;

  const today = todayRange(tz);
  const week = weekRange(tz, weekStartsOn);
  const month = monthRange(tz);

  // Pull a 60-day window once for streak calculation, then derive today / week / month
  const sixtyAgo = new Date(today.from.getTime() - 60 * 24 * 60 * 60 * 1000);
  const { data } = useGetDailyTotalsQuery(
    { from: sixtyAgo, to: today.to },
    { enabled: !USE_MOCK_TIME_DATA }
  );

  const rows = USE_MOCK_TIME_DATA
    ? getMockDailyTotals(sixtyAgo, today.to, tz)
    : data?.dailyTotals ?? [];

  // Derive today's, week's, month's totals from the 60-day window so we make one query
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const todayMinutes =
    rows.find((r) => r?.date === todayKey)?.totalMinutes ?? 0;

  const weekFromMs = week.from.getTime();
  const weekToMs = week.to.getTime();
  const monthFromMs = month.from.getTime();
  const monthToMs = month.to.getTime();

  const weekMinutes = rows.reduce((acc, r) => {
    if (!r?.date) return acc;
    const d = new Date(`${r.date}T00:00:00Z`).getTime();
    return d >= weekFromMs && d < weekToMs ? acc + (r.totalMinutes ?? 0) : acc;
  }, 0);

  const monthMinutes = rows.reduce((acc, r) => {
    if (!r?.date) return acc;
    const d = new Date(`${r.date}T00:00:00Z`).getTime();
    return d >= monthFromMs && d < monthToMs ? acc + (r.totalMinutes ?? 0) : acc;
  }, 0);

  // Current streak = consecutive days (counting back from yesterday, or today if today already hit goal)
  // ending in a day where totalMinutes >= goal.
  const byDate = new Map<string, number>();
  for (const r of rows) {
    if (r?.date) byDate.set(r.date, r.totalMinutes ?? 0);
  }
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

  let streak = 0;
  let cursor = new Date();
  // If today hasn't hit goal yet, start from yesterday
  if ((byDate.get(dayKey(cursor)) ?? 0) < goal) {
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  while (true) {
    const k = dayKey(cursor);
    if ((byDate.get(k) ?? 0) >= goal) {
      streak++;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
    if (streak > 60) break; // safety
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat
        label={t("today")}
        value={formatMinutes(todayMinutes)}
        hint={t("todayHint", { percent: Math.round((todayMinutes / goal) * 100) })}
      />
      <Stat label={t("thisWeek")} value={formatMinutes(weekMinutes)} />
      <Stat label={t("thisMonth")} value={formatMinutes(monthMinutes)} />
      <Stat
        label={t("streak")}
        value={streak === 0 ? t("streakNoneShort") : t("streakDays", { days: streak })}
        hint={streak === 0 ? t("streakNone") : t("streakHint")}
      />
    </div>
  );
}

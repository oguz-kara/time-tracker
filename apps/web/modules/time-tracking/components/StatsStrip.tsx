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
import { Card, CardContent } from "@/components/ui/card";

interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

function Stat({ label, value, hint }: StatProps) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 font-mono text-2xl font-medium tabular-nums">
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        )}
      </CardContent>
    </Card>
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

  // Derive today's, week's, month's totals from the 60-day window so we make
  // one query. Compare on YYYY-MM-DD strings *in the user's tz* — comparing
  // ms since epoch ("date as UTC midnight" vs "tz-shifted local midnight")
  // double-counts boundary days for non-zero offsets.
  const tzDateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const tzKey = (d: Date) => tzDateFmt.format(d);

  const todayKey = tzKey(new Date());
  // For [from, to) windows, the 'to' Date is exclusive — subtract a tick before
  // formatting so the upper bound is the *last included day*, then compare with <=.
  const weekFromKey = tzKey(week.from);
  const weekLastKey = tzKey(new Date(week.to.getTime() - 1));
  const monthFromKey = tzKey(month.from);
  const monthLastKey = tzKey(new Date(month.to.getTime() - 1));

  const todayMinutes =
    rows.find((r) => r?.date === todayKey)?.totalMinutes ?? 0;

  const weekMinutes = rows.reduce((acc, r) => {
    if (!r?.date) return acc;
    return r.date >= weekFromKey && r.date <= weekLastKey
      ? acc + (r.totalMinutes ?? 0)
      : acc;
  }, 0);

  const monthMinutes = rows.reduce((acc, r) => {
    if (!r?.date) return acc;
    return r.date >= monthFromKey && r.date <= monthLastKey
      ? acc + (r.totalMinutes ?? 0)
      : acc;
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

"use client";

import {
  useGetDailyTotalsQuery,
  useGetUserSettingsQuery,
} from "@/lib/graphql/generated";
import { useTranslations } from "next-intl";
import { weekRange, monthRange, formatMinutes } from "../utils/format";
import { useUserTimezone } from "../hooks/useUserTimezone";

export function PeriodTotals() {
  const t = useTranslations("track.totals");
  const { data: settingsData } = useGetUserSettingsQuery();
  const tz = useUserTimezone();
  const weekStartsOn = ((settingsData?.userSettings?.weekStartsOn ?? 1) as 0 | 1);

  const week = weekRange(tz, weekStartsOn);
  const month = monthRange(tz);

  const { data: weekData } = useGetDailyTotalsQuery({ from: week.from, to: week.to });
  const { data: monthData } = useGetDailyTotalsQuery({ from: month.from, to: month.to });

  const sum = (rows: Array<{ totalMinutes?: number | null }> | null | undefined) =>
    rows?.reduce((acc, r) => acc + (r.totalMinutes ?? 0), 0) ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-md border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">{t("thisWeek")}</div>
        <div className="mt-2 font-mono text-2xl font-medium tabular-nums">
          {formatMinutes(sum(weekData?.dailyTotals))}
        </div>
      </div>
      <div className="rounded-md border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">{t("thisMonth")}</div>
        <div className="mt-2 font-mono text-2xl font-medium tabular-nums">
          {formatMinutes(sum(monthData?.dailyTotals))}
        </div>
      </div>
    </div>
  );
}

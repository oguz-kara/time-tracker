"use client";

import { useEffect, useState } from "react";
import {
  useGetDailyTotalsQuery,
  useGetUserSettingsQuery,
  useGetCurrentEntryQuery,
} from "@/lib/graphql/generated";
import { useTranslations } from "next-intl";
import { todayRange, formatMinutes } from "../utils/format";
import { useUserTimezone } from "../hooks/useUserTimezone";

export function GoalProgress() {
  const t = useTranslations("track.goal");
  const { data: settingsData } = useGetUserSettingsQuery();
  const tz = useUserTimezone();
  const goal = settingsData?.userSettings?.dailyGoalMinutes ?? 480;

  const { from, to } = todayRange(tz);
  const { data } = useGetDailyTotalsQuery({ from, to });
  const { data: currentData } = useGetCurrentEntryQuery();

  const baseMinutes = data?.dailyTotals?.[0]?.totalMinutes ?? 0;

  // Soft live tick when running, so the bar doesn't sit still between fetches.
  // The server total already includes (now() - start) at fetch time; we just
  // re-render every 30s to keep things fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!currentData?.currentEntry) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [currentData?.currentEntry?.id]);

  const liveMinutes = baseMinutes;
  const pct = Math.min(100, Math.round((liveMinutes / goal) * 100));
  const over = liveMinutes - goal;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{t("today")}</span>
        <span className="font-mono text-sm tabular-nums">
          {formatMinutes(liveMinutes)} / {formatMinutes(goal)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full transition-all ${
            over >= 0 ? "bg-emerald-500" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over > 0 && (
        <div className="mt-2 text-xs text-emerald-500">
          +{t("overGoal", { minutes: formatMinutes(over) })}
        </div>
      )}
    </div>
  );
}

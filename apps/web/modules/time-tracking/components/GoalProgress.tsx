"use client";

import { useEffect, useState } from "react";
import {
  useGetDailyTotalsQuery,
  useGetUserSettingsQuery,
  useGetCurrentEntryQuery,
} from "@/lib/graphql/generated";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { todayRange, formatMinutes } from "../utils/format";
import { useUserTimezone } from "../hooks/useUserTimezone";
import { cn } from "@/lib/utils";

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
    <Card size="sm">
      <CardContent>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">{t("today")}</span>
          <span className="font-mono text-sm tabular-nums">
            {formatMinutes(liveMinutes)} / {formatMinutes(goal)}
          </span>
        </div>
        <Progress
          value={pct}
          className={cn(
            "h-2",
            over >= 0 &&
              "[&_[data-slot=progress-indicator]]:bg-emerald-500"
          )}
        />
        {over > 0 && (
          <div className="mt-2 text-xs text-emerald-500">
            +{t("overGoal", { minutes: formatMinutes(over) })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  useGetDailyTotalsQuery,
  useGetCurrentEntryQuery,
} from "@/lib/graphql/generated";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { todayRange, formatMinutes } from "../utils/format";
import { useTrackingPrefs } from "../hooks/useTrackingPrefs";
import { cn } from "@/lib/utils";

interface Props {
  /**
   * Day window to render progress for. Defaults to today in the user's tz.
   * Pass an explicit range from /history to render past days.
   */
  range?: { from: Date; to: Date };
  /**
   * Whether to live-tick (re-render every 30s while a timer runs). Defaults
   * to true; pass `false` on /history (past days don't tick).
   */
  isLive?: boolean;
}

export function GoalProgress({ range, isLive = true }: Props) {
  const t = useTranslations("track.goal");
  const { tz, goal } = useTrackingPrefs();

  const { from, to } = range ?? todayRange(tz);
  const { data } = useGetDailyTotalsQuery({ from, to });
  const { data: currentData } = useGetCurrentEntryQuery();

  const baseMinutes = data?.dailyTotals?.[0]?.totalMinutes ?? 0;

  // Soft live tick when running, so the bar doesn't sit still between
  // refetches. The server total already includes (now() - start) at fetch
  // time; we just re-render every 30s to keep things fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isLive || !currentData?.currentEntry) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [isLive, currentData?.currentEntry?.id]);

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

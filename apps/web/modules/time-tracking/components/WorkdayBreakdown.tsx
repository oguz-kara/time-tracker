"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useGetEntriesQuery,
  useGetCurrentEntryQuery,
} from "@/lib/graphql/generated";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { todayRange, formatMinutes, formatTimeOfDay } from "../utils/format";
import { useTrackingPrefs } from "../hooks/useTrackingPrefs";
import { computeDayBreakdown } from "../utils/breakdown";
import {
  USE_MOCK_TIME_DATA,
  getMockEntries,
} from "../mocks/daily-totals";

interface Props {
  /** Day window. Defaults to today in user's tz. */
  range?: { from: Date; to: Date };
  /** Whether to live-tick. Pass `false` on /history (past days don't tick). */
  isLive?: boolean;
}

export function WorkdayBreakdown({ range, isLive = true }: Props) {
  const t = useTranslations("track.workday");
  const { tz } = useTrackingPrefs();

  const { from, to } = range ?? todayRange(tz);
  const { data } = useGetEntriesQuery(
    { from, to },
    { enabled: !USE_MOCK_TIME_DATA }
  );
  const { data: currentData } = useGetCurrentEntryQuery();

  const realEntries = data?.entries ?? [];
  const entries = USE_MOCK_TIME_DATA
    ? getMockEntries(from, to, tz)
    : realEntries;

  // Soft live tick — only when a timer is running. Same pattern as
  // GoalProgress: a throwaway state update to force re-render so `now()`
  // recomputes inside the breakdown calculation.
  const [tickNow, setTickNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!isLive || !currentData?.currentEntry) return;
    const id = setInterval(() => setTickNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [isLive, currentData?.currentEntry?.id]);

  const breakdown = useMemo(
    () => computeDayBreakdown(entries, new Date(tickNow)),
    [entries, tickNow]
  );

  const hasEntries = breakdown.workdayStart !== null;
  const workedMin = Math.round(breakdown.workedMs / 60_000);
  const breakMin = Math.round(breakdown.breakMs / 60_000);
  const windowMin = Math.round(breakdown.windowMs / 60_000);

  // Bar widths as percentages of the window. When the window is zero
  // (no entries) the bar collapses to nothing.
  const workedPct =
    breakdown.windowMs > 0
      ? Math.min(100, (breakdown.workedMs / breakdown.windowMs) * 100)
      : 0;
  const breakPct = Math.max(0, 100 - workedPct);

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">{t("title")}</span>
          {hasEntries && breakdown.workdayStart && breakdown.workdayEnd && (
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {formatTimeOfDay(breakdown.workdayStart, tz)}
              {" → "}
              {formatTimeOfDay(breakdown.workdayEnd, tz)}
              {" · "}
              {formatMinutes(windowMin)}
            </span>
          )}
        </div>

        {!hasEntries ? (
          <p className="text-xs text-muted-foreground">{t("noEntries")}</p>
        ) : (
          <>
            {/* Worked / break bar */}
            <div
              className="flex h-2 w-full overflow-hidden rounded-full bg-secondary"
              role="img"
              aria-label={`${t("worked")} ${formatMinutes(
                workedMin
              )}, ${t("breaks")} ${formatMinutes(breakMin)}`}
            >
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${workedPct}%` }}
              />
              <div
                className="h-full bg-muted-foreground/40 transition-all"
                style={{ width: `${breakPct}%` }}
              />
            </div>

            {/* Worked + breaks legend */}
            <div className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">{t("worked")}</span>
                <span className="font-mono tabular-nums">
                  {formatMinutes(workedMin)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span className="text-muted-foreground">{t("breaks")}</span>
                <span className="font-mono tabular-nums">
                  {formatMinutes(breakMin)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

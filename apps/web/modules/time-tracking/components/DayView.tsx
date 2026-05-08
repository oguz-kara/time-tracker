"use client";

import { useMemo } from "react";
import { Timer } from "./Timer";
import { GoalProgress } from "./GoalProgress";
import { WorkdayBreakdown } from "./WorkdayBreakdown";
import { EntryList } from "./EntryList";
import { PeriodTotals } from "./PeriodTotals";
import { TagFilter } from "./TagFilter";
import { dayRange, todayRange } from "../utils/format";
import { useTrackingPrefs } from "../hooks/useTrackingPrefs";
import { useTagFilter } from "../hooks/useTagFilter";

interface Props {
  /**
   * The calendar day to render. Time-of-day is ignored. Defaults to "today
   * in user's tz" when omitted.
   */
  date?: Date;
  /**
   * Title override for the entry list (e.g. /history shows "Entries for
   * <date>"). When omitted the EntryList uses its own translated default.
   */
  entriesTitle?: string;
  /**
   * Whether to show the Timer + period (week/month) totals. /history hides
   * these because they're "now"-relative. Defaults to true.
   */
  showLive?: boolean;
}

/**
 * Single day's view. Owns the date→range derivation and the tag filter
 * state, then composes the existing tracking components with the right
 * range and live-tick flags.
 *
 * /track renders <DayView /> (defaults to today, full live UX).
 * /history renders <DayView date={selected} showLive={false} />.
 */
export function DayView({ date, entriesTitle, showLive = true }: Props) {
  const { tz } = useTrackingPrefs();
  const range = useMemo(
    () => (date ? dayRange(date, tz) : todayRange(tz)),
    [date, tz]
  );
  const [activeTag, setActiveTag] = useTagFilter();

  return (
    <div className="space-y-4">
      {showLive && <Timer />}
      <GoalProgress range={range} isLive={showLive} />
      <WorkdayBreakdown range={range} isLive={showLive} />
      <TagFilter value={activeTag} onChange={setActiveTag} />
      <EntryList range={range} activeTag={activeTag} title={entriesTitle} />
      {showLive && <PeriodTotals />}
    </div>
  );
}

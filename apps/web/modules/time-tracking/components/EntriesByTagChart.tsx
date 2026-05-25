"use client";

import { useGetEntriesQuery } from "@/lib/graphql/generated";
import { USE_MOCK_TIME_DATA, getMockEntries } from "../mocks/daily-totals";
import { useTrackingPrefs } from "../hooks/useTrackingPrefs";
import { bucketByDay, buildDateList } from "../utils/bucketByDay";
import { DailyBarsChart } from "./DailyBarsChart";

interface Props {
  /** Window to display — `[from, to)` in UTC, matching the GraphQL resolver. */
  range: { from: Date; to: Date };
  /** Tag to filter by — only entries containing this tag contribute. */
  tag: string;
  title: string;
  description?: string;
}

/**
 * Per-tag daily totals chart. Fetches raw entries in `range`, then buckets
 * them client-side via `bucketByDay`, filtering to the chosen tag. Used by
 * the dashboard when a tag filter is active.
 *
 * Two reasons we don't use `dailyTotals` here:
 *   1. There's no server-side filter-by-tag variant (and adding one means
 *      a third SQL aggregation path for marginal benefit at this scale).
 *   2. The page already needs raw entries for other tag-aware views, so
 *      this reuses an existing fetch instead of a new one.
 */
export function EntriesByTagChart({ range, tag, title, description }: Props) {
  const { tz, goal } = useTrackingPrefs();
  const { from, to } = range;

  const { data, isLoading } = useGetEntriesQuery(
    { from, to },
    { enabled: !USE_MOCK_TIME_DATA }
  );

  const entries = USE_MOCK_TIME_DATA
    ? getMockEntries(from, to, tz)
    : data?.entries ?? [];

  const dateList = buildDateList(from, to, tz);
  const chartData = bucketByDay(entries, from, to, dateList, tz, tag);

  return (
    <DailyBarsChart
      data={chartData}
      goal={goal}
      title={title}
      description={description}
      isLoading={isLoading && !USE_MOCK_TIME_DATA}
    />
  );
}

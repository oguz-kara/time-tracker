"use client";

import {
  useGetDailyTotalsQuery,
  useGetUserSettingsQuery,
} from "@/lib/graphql/generated";
import { USE_MOCK_TIME_DATA, getMockDailyTotals } from "../mocks/daily-totals";
import { useUserTimezone } from "../hooks/useUserTimezone";
import { buildDateList, type DayBucket } from "../utils/bucketByDay";
import { DailyBarsChart } from "./DailyBarsChart";

interface Props {
  /** Window to display — `[from, to)` in UTC, matching the GraphQL resolver. */
  range: { from: Date; to: Date };
  title: string;
  description?: string;
}

/**
 * Server-aggregated daily totals chart. Fetches `dailyTotals(from, to)` from
 * GraphQL, zero-fills missing days, and hands the result to `DailyBarsChart`.
 *
 * Used when no tag filter is active. When a tag is selected, the dashboard
 * swaps this for `EntriesByTagChart`, which buckets raw entries client-side.
 */
export function DailyTotalsChart({ range, title, description }: Props) {
  const { data: settingsData } = useGetUserSettingsQuery();
  const tz = useUserTimezone();
  const goal = settingsData?.userSettings?.dailyGoalMinutes ?? 480;

  const { from, to } = range;

  const { data, isLoading } = useGetDailyTotalsQuery(
    { from, to },
    { enabled: !USE_MOCK_TIME_DATA }
  );

  const rows = USE_MOCK_TIME_DATA
    ? getMockDailyTotals(from, to, tz)
    : data?.dailyTotals ?? [];

  const dateList = buildDateList(from, to, tz);
  const byDate = new Map<string, number>();
  for (const row of rows) {
    if (row?.date) byDate.set(row.date, row.totalMinutes ?? 0);
  }
  const chartData: DayBucket[] = dateList.map((date) => ({
    date,
    totalMinutes: byDate.get(date) ?? 0,
  }));

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

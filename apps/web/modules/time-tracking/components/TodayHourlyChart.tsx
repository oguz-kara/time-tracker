"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  useGetEntriesQuery,
  useGetUserSettingsQuery,
} from "@/lib/graphql/generated";
import { todayRange, formatMinutes } from "../utils/format";
import { USE_MOCK_TIME_DATA, getMockEntries } from "../mocks/daily-totals";
import { useUserTimezone } from "../hooks/useUserTimezone";
import { useTranslations } from "next-intl";

const chartConfig = {
  minutes: {
    label: "Minutes",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface EntryLike {
  start: string | Date;
  stop?: string | Date | null;
}

/**
 * Bucket entries into 24 hourly slots (in the user's tz).
 * For each entry, attribute its minutes to the hour-of-day they fall in.
 * Running entries count up to now.
 */
function bucketByHour(entries: EntryLike[], tz: string): { hour: number; minutes: number }[] {
  const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, minutes: 0 }));
  const now = Date.now();

  for (const e of entries) {
    const startMs = new Date(e.start).getTime();
    const stopMs = e.stop ? new Date(e.stop).getTime() : now;

    let cursor = startMs;
    while (cursor < stopMs) {
      const hourLabel = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "2-digit",
          hour12: false,
        }).format(new Date(cursor))
      );
      // Find end of this hour in tz: walk forward until the hour digit flips.
      // Cheaper: clamp to the next exact hour boundary in UTC + offset.
      // Approximation: advance by min(stopMs - cursor, 60 minutes - (cursor minute offset)).
      // Simpler: step in 1-minute increments — at most 24*60 iterations per entry, fine for v1.
      // We use minutes-resolution rather than millisecond clamping to keep the math obvious.
      const minuteStep = Math.min(stopMs - cursor, 60_000);
      buckets[hourLabel].minutes += minuteStep / 60_000;
      cursor += minuteStep;
    }
  }

  // Round once at the end
  for (const b of buckets) b.minutes = Math.round(b.minutes);
  return buckets;
}

export function TodayHourlyChart() {
  const t = useTranslations("dashboard.charts");
  // Keep the settings query mounted (other consumers depend on it being warm)
  useGetUserSettingsQuery();
  const tz = useUserTimezone();

  const { from, to } = todayRange(tz);
  const { data, isLoading } = useGetEntriesQuery(
    { from, to },
    { enabled: !USE_MOCK_TIME_DATA }
  );

  const entries: EntryLike[] = USE_MOCK_TIME_DATA
    ? getMockEntries(from, to, tz)
    : (data?.entries ?? []).filter((e): e is NonNullable<typeof e> & { start: string | Date } => !!e?.start);

  const chartData = bucketByHour(entries, tz);
  const totalMinutes = chartData.reduce((acc, b) => acc + b.minutes, 0);
  const showLoading = isLoading && !USE_MOCK_TIME_DATA;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-medium">{t("todayTitle")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("todaySub")}
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {formatMinutes(totalMinutes)}
        </div>
      </div>

      {showLoading ? (
        <div className="h-[180px] animate-pulse rounded bg-muted" />
      ) : (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 4" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              ticks={[0, 6, 12, 18]}
              tickFormatter={(v: number) => {
                const pad = (n: number) => n.toString().padStart(2, "0");
                return `${pad(v)}:00`;
              }}
              fontSize={10}
              stroke="hsl(var(--muted-foreground))"
              type="number"
              domain={[0, 23]}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tickFormatter={(v: number) => `${v}m`}
              fontSize={10}
              stroke="hsl(var(--muted-foreground))"
              width={32}
              domain={[0, 60]}
              ticks={[0, 30, 60]}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload as { hour?: number } | undefined;
                    const h = typeof item?.hour === "number" ? item.hour : NaN;
                    if (!Number.isFinite(h)) return "";
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    return `${pad(h)}:00 – ${pad((h + 1) % 24)}:00`;
                  }}
                  formatter={(value) => `${Math.round(Number(value))} min`}
                />
              }
            />
            <Bar
              dataKey="minutes"
              fill="hsl(var(--primary))"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

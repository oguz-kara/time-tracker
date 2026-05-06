"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useGetDailyTotalsQuery, useGetUserSettingsQuery } from "@/lib/graphql/generated";
import { formatMinutes } from "../utils/format";
import { USE_MOCK_TIME_DATA, getMockDailyTotals } from "../mocks/daily-totals";
import { useUserTimezone } from "../hooks/useUserTimezone";
import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  totalMinutes: {
    label: "Worked",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface Props {
  /** Number of days back to include (today included). */
  days: number;
  title?: string;
  description?: string;
}

/** Builds a date list of `days` days ending today, in `tz`. Each entry is YYYY-MM-DD. */
function buildDateList(days: number, tz: string): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const out: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    out.push(fmt.format(d));
  }
  return out;
}

function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  const tzString = date.toLocaleString("en-US", { timeZone: timezone });
  const utcString = date.toLocaleString("en-US", { timeZone: "UTC" });
  return (new Date(utcString).getTime() - new Date(tzString).getTime()) / 60_000;
}

/** Convert YYYY-MM-DD (in tz) to a UTC Date at local midnight. */
function dateInTzToUtc(date: string, tz: string): Date {
  const local = new Date(`${date}T00:00:00`);
  const offset = getTimezoneOffsetMinutes(local, tz);
  return new Date(local.getTime() - offset * 60_000);
}

export function DailyTotalsChart({ days, title, description }: Props) {
  const tCharts = useTranslations("dashboard.charts");
  const locale = useLocale();
  const { data: settingsData } = useGetUserSettingsQuery();
  const tz = useUserTimezone();
  const goal = settingsData?.userSettings?.dailyGoalMinutes ?? 480;

  const dateList = buildDateList(days, tz);
  const from = dateInTzToUtc(dateList[0], tz);
  const to = new Date(dateInTzToUtc(dateList[dateList.length - 1], tz).getTime() + 24 * 60 * 60 * 1000);

  const { data, isLoading } = useGetDailyTotalsQuery(
    { from, to },
    { enabled: !USE_MOCK_TIME_DATA }
  );

  const rows = USE_MOCK_TIME_DATA
    ? getMockDailyTotals(from, to, tz)
    : data?.dailyTotals ?? [];

  // Map rows by date, then fill missing days with 0
  const byDate = new Map<string, number>();
  for (const row of rows) {
    if (row?.date) byDate.set(row.date, row.totalMinutes ?? 0);
  }
  const chartData = dateList.map((d) => ({
    date: d,
    totalMinutes: byDate.get(d) ?? 0,
  }));

  const showLoading = isLoading && !USE_MOCK_TIME_DATA;

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.18em]">
          {tCharts("goal", { hours: Math.floor(goal / 60) })}
        </Badge>
      </CardHeader>
      <CardContent>
        {showLoading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : (
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 4" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              tickFormatter={(value: string) => {
                // YYYY-MM-DD → locale-aware "May 02" / "02 May" / "02 May" etc.
                // Parse as local-noon to dodge tz boundary shifts.
                const [y, m, d] = value.split("-").map(Number);
                if (!y || !m || !d) return value;
                return new Intl.DateTimeFormat(locale, {
                  month: "short",
                  day: "2-digit",
                }).format(new Date(y, m - 1, d, 12));
              }}
              fontSize={10}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tickFormatter={(v: number) => `${Math.round(v / 60)}h`}
              fontSize={10}
              stroke="hsl(var(--muted-foreground))"
              width={32}
              domain={[0, Math.max(goal * 1.25, 600)]}
              ticks={[0, goal / 2, goal, goal * 1.25].map((n) => Math.round(n))}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => {
                    const value = String(label ?? "");
                    const [y, m, d] = value.split("-").map(Number);
                    if (!y || !m || !d) return value;
                    return new Intl.DateTimeFormat(locale, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(y, m - 1, d, 12));
                  }}
                  formatter={(value) => formatMinutes(Number(value))}
                />
              }
            />
            <ReferenceLine
              y={goal}
              stroke="hsl(var(--foreground) / 0.35)"
              strokeDasharray="3 3"
            />
            <Bar
              dataKey="totalMinutes"
              fill="hsl(var(--primary))"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale, useTranslations } from "next-intl";
import { formatMinutes } from "../utils/format";
import type { DayBucket } from "../utils/bucketByDay";

const chartConfig = {
  totalMinutes: {
    label: "Worked",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface Props {
  /** One bucket per visible day; zero-fill expected from the caller. */
  data: DayBucket[];
  /** Daily goal in minutes — drives the YAxis domain and the dashed reference line. */
  goal: number;
  /** Card header text. */
  title: string;
  /** Card subtitle (optional). */
  description?: string;
  /** Whether to show the loading skeleton instead of the chart. */
  isLoading?: boolean;
}

/**
 * Stateless bar chart for daily totals. No queries, no tz logic, no
 * conditionals — feed it `data` and it renders. Two smart wrappers
 * supply that data:
 *
 *   - `DailyTotalsChart` (server-aggregated, no tag filter)
 *   - `EntriesByTagChart` (raw entries + client-side bucketing for a tag)
 *
 * Both render the same shape, so the visual swap when toggling a tag
 * filter is a clean component-level mount/unmount.
 */
export function DailyBarsChart({
  data,
  goal,
  title,
  description,
  isLoading = false,
}: Props) {
  const tCharts = useTranslations("dashboard.charts");
  const locale = useLocale();
  const totalMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0);

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <span
            className="font-mono text-sm tabular-nums"
            aria-label={tCharts("total")}
          >
            {formatMinutes(totalMinutes)}
          </span>
          <Badge
            variant="outline"
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
          >
            {tCharts("goal", { hours: Math.floor(goal / 60) })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--border))"
                strokeDasharray="2 4"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                tickFormatter={(value: string) => {
                  // YYYY-MM-DD → locale-aware short label. Parse at local-noon
                  // to dodge tz boundary shifts on the rendering side.
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
                ticks={[0, goal / 2, goal, goal * 1.25].map((n) =>
                  Math.round(n)
                )}
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

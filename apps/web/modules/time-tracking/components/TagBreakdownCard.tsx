"use client";

import { useTranslations } from "next-intl";
import { useGetTagTotalsQuery } from "@/lib/graphql/generated";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { USE_MOCK_TIME_DATA, getMockTagTotals } from "../mocks/daily-totals";
import { useTrackingPrefs } from "../hooks/useTrackingPrefs";
import { formatMinutes } from "../utils/format";

interface Props {
  range: { from: Date; to: Date };
  /** Currently-filtered tag — selected row is highlighted, others dimmed. */
  activeTag: string | null;
  /** Click a row to toggle the filter. Clicking the active tag clears it. */
  onTagClick: (tag: string | null) => void;
}

const UNTAGGED_SENTINEL = "(untagged)";

/**
 * Stacked-bar breakdown of how time was spent across tags in `range`.
 * Each row is a clickable button that toggles the dashboard's tag filter.
 *
 * Bars are widths-as-% of the largest tag in the set, mirroring how
 * `WorkdayBreakdown` renders simple horizontal bars (no recharts overhead,
 * and trivially clickable).
 */
export function TagBreakdownCard({ range, activeTag, onTagClick }: Props) {
  const t = useTranslations("dashboard.tagBreakdown");
  const { tz } = useTrackingPrefs();
  const { from, to } = range;

  const { data, isLoading } = useGetTagTotalsQuery(
    { from, to },
    { enabled: !USE_MOCK_TIME_DATA }
  );

  const rawRows = USE_MOCK_TIME_DATA
    ? getMockTagTotals(from, to, tz)
    : data?.tagTotals ?? [];
  // Codegen marks list items + their fields as nullable (Pothos default).
  // Normalize once so the render loop deals in concrete `{tag, totalMinutes}`.
  const rows = rawRows.flatMap((r) =>
    r && typeof r.tag === "string" && typeof r.totalMinutes === "number"
      ? [{ tag: r.tag, totalMinutes: r.totalMinutes }]
      : []
  );

  const max = rows.reduce((m, r) => Math.max(m, r.totalMinutes), 0);
  const showLoading = isLoading && !USE_MOCK_TIME_DATA;

  return (
    <Card size="sm">
      <CardHeader className="space-y-0.5">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        <CardDescription className="text-xs">{t("sub")}</CardDescription>
      </CardHeader>
      <CardContent>
        {showLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noData")}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => {
              const pct = max > 0 ? (row.totalMinutes / max) * 100 : 0;
              const isActive = activeTag === row.tag;
              const isDimmed = activeTag !== null && !isActive;
              const label =
                row.tag === UNTAGGED_SENTINEL ? t("untagged") : row.tag;
              return (
                <li key={row.tag}>
                  <button
                    type="button"
                    onClick={() => onTagClick(isActive ? null : row.tag)}
                    className={cn(
                      "group block w-full rounded-md px-2 py-1.5 text-left transition-colors",
                      "hover:bg-muted/40",
                      isActive && "bg-muted/60"
                    )}
                  >
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                      <span
                        className={cn(
                          "truncate font-medium",
                          isDimmed && "text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                      <span
                        className={cn(
                          "font-mono tabular-nums text-muted-foreground"
                        )}
                      >
                        {formatMinutes(row.totalMinutes)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full bg-primary transition-all",
                          isDimmed && "opacity-30"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

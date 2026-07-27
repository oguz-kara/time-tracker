"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { addDays, weekStartKey } from "../utils/dates";

export interface HeatmapCheck {
  date: string;
  kind: string;
  count: number;
}

interface Props {
  habitType: string;
  /** YYYY-MM-DD the habit started existing (cells before it render void). */
  createdKey: string;
  todayKey: string;
  weekStartsOn: 0 | 1;
  checks: HeatmapCheck[];
  weeks?: number;
}

type CellState = "done" | "excused" | "missed" | "clean" | "slip" | "void" | "future";

const CELL_CLASSES: Record<CellState, string> = {
  done: "bg-primary",
  clean: "bg-primary",
  excused: "bg-primary/30",
  missed: "bg-muted",
  slip: "bg-destructive/80",
  void: "bg-muted/30",
  future: "opacity-0",
};

/**
 * GitHub-style calendar heatmap: one column per week, one row per weekday.
 * Status encoding (not magnitude): within a habit the states are lightness
 * steps of the single accent hue, so they survive CVD; the legend and
 * per-cell tooltips carry identity so color is never the only channel.
 */
export function HabitHeatmap({
  habitType,
  createdKey,
  todayKey,
  weekStartsOn,
  checks,
  weeks = 16,
}: Props) {
  const t = useTranslations("habits.history");
  const byDate = new Map(checks.map((c) => [c.date, c]));

  const currentWeekStart = weekStartKey(todayKey, weekStartsOn);
  const gridStart = addDays(currentWeekStart, -7 * (weeks - 1));

  const stateFor = (date: string): CellState => {
    if (date > todayKey) return "future";
    if (date < createdKey) return "void";
    const check = byDate.get(date);
    if (habitType === "bad") {
      return check?.kind === "slip" ? "slip" : "clean";
    }
    if (check?.kind === "done") return "done";
    if (check?.kind === "skip") return "excused";
    return "missed";
  };

  const labelFor = (state: CellState): string => {
    switch (state) {
      case "done":
        return t("done");
      case "excused":
        return t("excused");
      case "missed":
        return t("missed");
      case "clean":
        return t("clean");
      case "slip":
        return t("slip");
      default:
        return "";
    }
  };

  const columns: { weekStart: string; days: string[] }[] = [];
  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(gridStart, w * 7);
    columns.push({
      weekStart,
      days: Array.from({ length: 7 }, (_, d) => addDays(weekStart, d)),
    });
  }

  // Sparse month labels: mark a column when its month differs from the previous column's.
  const monthOf = (key: string) => key.slice(0, 7);
  const legendStates: CellState[] =
    habitType === "bad" ? ["clean", "slip"] : ["done", "excused", "missed"];

  return (
    <div className="space-y-2">
      <div className="flex gap-0.5 pl-0">
        {columns.map((col, i) => {
          const showMonth = i === 0 || monthOf(col.weekStart) !== monthOf(columns[i - 1].weekStart);
          return (
            <div key={col.weekStart} className="w-3 font-mono text-[9px] text-muted-foreground">
              {showMonth
                ? new Date(`${col.weekStart}T12:00:00Z`).toLocaleDateString(undefined, {
                    month: "short",
                    timeZone: "UTC",
                  })
                : " "}
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5">
        {columns.map((col) => (
          <div key={col.weekStart} className="flex flex-col gap-0.5">
            {col.days.map((date) => {
              const state = stateFor(date);
              const check = byDate.get(date);
              const slipSuffix =
                state === "slip" && (check?.count ?? 0) > 1 ? ` ×${check!.count}` : "";
              return (
                <div
                  key={date}
                  title={state === "future" || state === "void" ? date : `${date} — ${labelFor(state)}${slipSuffix}`}
                  className={cn("h-2.5 w-2.5 rounded-[2px]", CELL_CLASSES[state])}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-1">
        {legendStates.map((state) => (
          <span key={state} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-[2px]", CELL_CLASSES[state])} />
            {labelFor(state)}
          </span>
        ))}
      </div>
    </div>
  );
}

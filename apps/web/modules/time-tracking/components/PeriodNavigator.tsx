"use client";

import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTrackingPrefs } from "../hooks/useTrackingPrefs";
import type { Granularity } from "../utils/format";

interface Props {
  granularity: Granularity;
  range: { from: Date; to: Date };
  anchor: Date;
  onGranularityChange: (next: Granularity) => void;
  onAnchorChange: (next: Date) => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Renders the current `[from, to)` window as a single localized label.
 * Week: "May 18 – May 24, 2026". Month: "May 2026".
 *
 * `to` is exclusive, so subtract one day for display. All formatting uses
 * the user's tz so labels reflect the same calendar boundaries the chart
 * is using — without it, an east-of-UTC tz can show the wrong end date.
 */
function formatRangeLabel(
  granularity: Granularity,
  range: { from: Date; to: Date },
  locale: string,
  tz: string
): string {
  const lastDay = new Date(range.to.getTime() - 24 * 60 * 60 * 1000);

  if (granularity === "month") {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      month: "long",
      year: "numeric",
    }).format(range.from);
  }

  const monthOf = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, month: "2-digit" }).format(
      d
    );
  const yearOf = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric" }).format(
      d
    );
  const sameMonth = monthOf(range.from) === monthOf(lastDay);
  const sameYear = yearOf(range.from) === yearOf(lastDay);
  const startFmt = new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endFmt = new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startFmt.format(range.from)} – ${endFmt.format(lastDay)}`;
}

/**
 * Date-range nav control: granularity Select + prev/next icon buttons +
 * Popover Calendar for jump-to-date. Stateless — all state lives in
 * `usePeriodState`, this component just renders + delegates.
 */
export function PeriodNavigator({
  granularity,
  range,
  anchor,
  onGranularityChange,
  onAnchorChange,
  onPrev,
  onNext,
}: Props) {
  const tNav = useTranslations("dashboard.nav");
  const tAria = useTranslations("common.aria");
  const locale = useLocale();
  const { tz } = useTrackingPrefs();
  const label = formatRangeLabel(granularity, range, locale, tz);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={granularity}
        onValueChange={(v) => onGranularityChange(v as Granularity)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">{tNav("week")}</SelectItem>
          <SelectItem value="month">{tNav("month")}</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={onPrev}
          aria-label={tAria("prevPeriod")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                type="button"
                className={cn(
                  "justify-start text-left font-normal min-w-[200px]"
                )}
              />
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </PopoverTrigger>
          <PopoverContent
            className="p-0 [width:var(--anchor-width)]"
            align="start"
          >
            <Calendar
              mode="single"
              selected={anchor}
              onSelect={(d) => d && onAnchorChange(d)}
              defaultMonth={anchor}
              className="w-full [--cell-size:36px]"
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={onNext}
          aria-label={tAria("nextPeriod")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

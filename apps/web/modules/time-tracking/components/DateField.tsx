"use client";

import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  value: Date;
  onChange: (next: Date) => void;
  /**
   * Latest selectable date (inclusive). When omitted, future dates are
   * blocked using a fresh `new Date()` evaluated at click/render time
   * (so a long-lived page automatically unlocks "tomorrow" when midnight
   * passes — no captured stale value).
   */
  maxDate?: Date;
}

/**
 * Date-only picker with prev/next-day buttons. Time-of-day on `value` is
 * ignored — only the calendar day matters.
 *
 * The arrow buttons step by 24h. The calendar popup uses the same anchor-
 * width trick as DateTimeField so the popover matches the trigger width.
 *
 * Future dates are disabled by default (history is past-only).
 */
export function DateField({ value, onChange, maxDate }: Props) {
  const tc = useTranslations("common");

  /** Resolved "now" each call so it can't go stale on long-lived pages. */
  const getMax = () => maxDate ?? new Date();

  const stepDays = (delta: number) => {
    const next = new Date(value.getTime() + delta * 24 * 60 * 60 * 1000);
    if (next.getTime() > getMax().getTime()) return;
    onChange(next);
  };

  // "At max" means we'd cross the boundary by stepping forward one day.
  // Comparing the result of stepping to the live max avoids tz/DST edge
  // cases that toDateString() comparisons would have.
  const isAtMax =
    new Date(value.getTime() + 24 * 60 * 60 * 1000).getTime() >
    getMax().getTime();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => stepDays(-1)}
        aria-label={tc("aria.prevDay")}
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
                "flex-1 justify-start text-left font-normal min-w-[180px]"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value, "PPP")}
        </PopoverTrigger>
        <PopoverContent
          className="p-0 [width:var(--anchor-width)]"
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => d && onChange(d)}
            defaultMonth={value}
            disabled={(d) => d.getTime() > getMax().getTime()}
            className="w-full [--cell-size:40px]"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => stepDays(1)}
        disabled={isAtMax}
        aria-label={tc("aria.nextDay")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

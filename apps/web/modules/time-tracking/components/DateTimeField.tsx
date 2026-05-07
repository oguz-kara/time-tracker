"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  /** Current date+time (or null for unset / running entry's stop). */
  value: Date | null;
  /** Called with the new Date whenever the user picks a date or types a time. */
  onChange: (next: Date) => void;
  disabled?: boolean;
  id?: string;
  /** Placeholder for the date trigger when no value is set. */
  placeholder?: string;
}

/**
 * Combined date picker + time input. Replaces `<input type="datetime-local">`
 * with a styled, theme-consistent control. The two pieces are independently
 * editable and always merged into a single Date object via `onChange`.
 */
export function DateTimeField({
  value,
  onChange,
  disabled,
  id,
  placeholder,
}: Props) {
  const tc = useTranslations("common");
  // Derive the time input's value (HH:mm) from `value`. If `value` is null,
  // fall back to "00:00" so the field is editable but the time is sensible.
  const timeString = React.useMemo(() => {
    if (!value) return "00:00";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    // Preserve the existing time-of-day when the user changes only the date.
    const next = new Date(date);
    if (value) {
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    } else {
      next.setHours(0, 0, 0, 0);
    }
    onChange(next);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    // Preserve the existing date when the user changes only the time. If
    // there's no date yet, anchor to today so we have something to merge.
    const base = value ? new Date(value) : new Date();
    base.setHours(h, m, 0, 0);
    onChange(base);
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              type="button"
              disabled={disabled}
              data-empty={!value}
              className={cn(
                "flex-1 justify-start text-left font-normal",
                "data-[empty=true]:text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, "PPP")
          ) : (
            <span>{placeholder ?? tc("pickDate")}</span>
          )}
        </PopoverTrigger>
        <PopoverContent
          // Match the trigger's width via Base UI's anchor CSS variable.
          // Tailwind v3 doesn't support shorthand bg-(--var), so we use the
          // explicit `[width:var(--anchor-width)]` form.
          className="p-0 [width:var(--anchor-width)]"
          align="start"
        >
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={handleDateSelect}
            defaultMonth={value ?? undefined}
            // Stretch calendar to popover width and bump cell size so the
            // grid actually fills available space instead of clustering left.
            className="w-full [--cell-size:40px]"
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        value={timeString}
        onChange={handleTimeChange}
        disabled={disabled}
        className="w-[120px]"
        aria-label={tc("aria.time")}
      />
    </div>
  );
}

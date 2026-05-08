"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DateField } from "@/modules/time-tracking/components/DateField";
import { DayView } from "@/modules/time-tracking/components/DayView";
import { useTrackingPrefs } from "@/modules/time-tracking/hooks/useTrackingPrefs";

/**
 * YYYY-MM-DD calendar key for `date` in `tz`. Using this for "is the same
 * day?" comparisons keeps the logic correct when the browser's local tz
 * differs from the user's configured tz (a stale traveler's laptop, or a
 * server-rendered context).
 */
function tzDateKey(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** "Yesterday in `tz`" as a JS Date anchored at noon local — safe for further day math. */
function yesterdayInTz(tz: string): Date {
  const now = new Date();
  const todayKey = tzDateKey(now, tz);
  const [y, m, d] = todayKey.split("-").map(Number);
  // Subtract one day from the calendar-day components, then re-anchor
  // back into JS's local clock (history page only uses this Date as input
  // to dayRange, which re-bucketizes in tz, so any time-of-day is fine).
  const todayLocal = new Date(y!, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
  return new Date(todayLocal.getTime() - 24 * 60 * 60 * 1000);
}

export default function HistoryPage() {
  const t = useTranslations("history");
  const locale = useLocale();
  const { tz } = useTrackingPrefs();

  // Default to yesterday-in-user's-tz so the page lands in actual history
  // territory. The picker can navigate back to today, at which point we
  // surface a banner pointing to /track for the live experience.
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    yesterdayInTz(tz)
  );

  const isToday = useMemo(
    () => tzDateKey(selectedDate, tz) === tzDateKey(new Date(), tz),
    [selectedDate, tz]
  );

  const entriesTitle = useMemo(
    () =>
      t("entriesFor", {
        date: new Intl.DateTimeFormat(locale, {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: tz,
        }).format(selectedDate),
      }),
    [t, locale, selectedDate, tz]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-heading font-medium">{t("title")}</h1>
        <DateField value={selectedDate} onChange={setSelectedDate} />
      </div>

      {isToday && (
        <div className="rounded-md border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
          <span>{t("viewingToday")} </span>
          <Link
            href="/track"
            className="text-foreground underline decoration-dotted underline-offset-4 hover:text-primary"
          >
            {t("backToToday")}
          </Link>
        </div>
      )}

      <DayView
        date={selectedDate}
        showLive={false}
        entriesTitle={entriesTitle}
      />
    </div>
  );
}

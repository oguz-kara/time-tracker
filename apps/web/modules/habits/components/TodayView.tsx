"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDailyChecklistQuery } from "@/lib/graphql/generated";
import { useUserTimezone } from "@/modules/time-tracking/hooks/useUserTimezone";
import { DateField } from "@/modules/time-tracking/components/DateField";
import { dateKeyInTz } from "../utils/dates";
import { ChecklistItem } from "./ChecklistItem";
import { SprintStrip } from "./SprintStrip";

export function TodayView() {
  const t = useTranslations("habits.today");
  const tz = useUserTimezone();
  const [selected, setSelected] = useState<Date>(() => new Date());
  const dateKey = dateKeyInTz(selected, tz);

  const { data, isLoading } = useGetDailyChecklistQuery({ date: dateKey });
  const items = data?.dailyChecklist ?? [];

  return (
    <div className="space-y-4">
      <SprintStrip />
      <DateField value={selected} onChange={setSelected} />
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <ChecklistItem key={item.habit?.id ?? i} item={item} date={dateKey} />
          ))}
        </div>
      )}
    </div>
  );
}

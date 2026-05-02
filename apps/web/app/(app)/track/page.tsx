"use client";

import { useTranslations } from "next-intl";
import { Timer } from "@/modules/time-tracking/components/Timer";
import { GoalProgress } from "@/modules/time-tracking/components/GoalProgress";
import { EntryList } from "@/modules/time-tracking/components/EntryList";
import { PeriodTotals } from "@/modules/time-tracking/components/PeriodTotals";

export default function TrackPage() {
  const t = useTranslations("track");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-heading font-medium">{t("title")}</h1>
      <Timer />
      <GoalProgress />
      <EntryList />
      <PeriodTotals />
    </div>
  );
}

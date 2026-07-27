"use client";

import { useTranslations } from "next-intl";
import { TodayView } from "@/modules/habits/components/TodayView";

export default function HabitsPage() {
  const t = useTranslations("habits");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-heading font-medium">{t("title")}</h1>
      <TodayView />
    </div>
  );
}

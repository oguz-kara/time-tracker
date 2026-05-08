"use client";

import { useTranslations } from "next-intl";
import { DayView } from "@/modules/time-tracking/components/DayView";

export default function TrackPage() {
  const t = useTranslations("track");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-heading font-medium">{t("title")}</h1>
      <DayView />
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { SprintView } from "@/modules/habits/components/SprintView";

export default function HabitsSprintPage() {
  const t = useTranslations("habits.sprint");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-heading font-medium">{t("title")}</h1>
      <SprintView />
    </div>
  );
}

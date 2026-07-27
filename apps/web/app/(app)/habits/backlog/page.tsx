"use client";

import { useTranslations } from "next-intl";
import { BacklogView } from "@/modules/habits/components/BacklogView";

export default function HabitsBacklogPage() {
  const t = useTranslations("habits.backlog");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-heading font-medium">{t("title")}</h1>
      <BacklogView />
    </div>
  );
}

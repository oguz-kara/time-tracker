"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useGetActiveSprintQuery } from "@/lib/graphql/generated";

export function SprintStrip() {
  const t = useTranslations("habits.strip");
  const router = useRouter();
  const { data, isLoading } = useGetActiveSprintQuery();
  if (isLoading) return null;
  const view = data?.activeSprint ?? null;
  const sprint = view?.sprint ?? null;

  if (!view || !sprint || view.isPastEnd) {
    const hasSprint = view != null && sprint != null;
    return (
      <Card size="sm">
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {hasSprint ? t("retroDue") : t("noSprint")}
          </span>
          <Button size="sm" onClick={() => router.push("/habits/sprint")}>
            {hasSprint ? sprint.name : t("planCta")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="hover:underline"
            onClick={() => router.push("/habits/sprint")}
          >
            {sprint.name}
          </button>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {t("day", { day: view.dayNumber ?? 0, total: view.totalDays ?? 0 })} ·{" "}
            {t("overall", { pct: view.overallPct ?? 0 })}
          </span>
        </div>
        <Progress value={view.overallPct ?? 0} />
      </CardContent>
    </Card>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useGetCompletedSprintsQuery } from "@/lib/graphql/generated";

const OUTCOME_KEYS = ["graduated", "carried", "returned", "dropped"] as const;
type OutcomeKey = (typeof OUTCOME_KEYS)[number];

export function SprintHistoryList() {
  const t = useTranslations("habits.sprint");
  const tr = useTranslations("habits.retro");
  const { data } = useGetCompletedSprintsQuery();
  const sprints = data?.completedSprints ?? [];
  if (sprints.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {t("historyTitle")}
      </h2>
      {sprints.map((s, i) => (
        <Card key={s.sprint?.id ?? i} size="sm">
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{s.sprint?.name}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {s.sprint?.startsOn} → {s.sprint?.endsOn} · {s.overallPct ?? 0}%
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(s.members ?? []).map((m, j) => (
                <Badge key={m.habit?.id ?? j} variant="outline" className="gap-1">
                  {m.habit?.name} · {m.completionPct ?? 0}%
                  {m.outcome && OUTCOME_KEYS.includes(m.outcome as OutcomeKey) && (
                    <span className="text-muted-foreground">
                      · {tr(m.outcome as OutcomeKey)}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
            {s.sprint?.retroNotes && (
              <p className="text-xs text-muted-foreground">{s.sprint.retroNotes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

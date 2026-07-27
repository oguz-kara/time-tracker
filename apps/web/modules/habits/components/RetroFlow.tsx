"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useCompleteRetroMutation,
  type GetActiveSprintQuery,
} from "@/lib/graphql/generated";
import { invalidateHabitsQueries } from "../utils/invalidate";
import { ChoiceButton } from "./ChoiceButton";

type View = NonNullable<GetActiveSprintQuery["activeSprint"]>;

const OUTCOMES = ["graduated", "carried", "returned", "dropped"] as const;

export function RetroFlow({ view }: { view: View }) {
  const t = useTranslations("habits.retro");
  const qc = useQueryClient();
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const complete = useCompleteRetroMutation({
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("completeFailed")),
    onSuccess: () => invalidateHabitsQueries(qc),
  });

  const members = (view.members ?? []).filter((m) => m.habit?.id);
  const sprintId = view.sprint?.id;
  const allDecided =
    members.length > 0 && members.every((m) => decisions[m.habit!.id as string]);

  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">
            {t("title")} — {view.sprint?.name}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="space-y-3">
          {members.map((m) => {
            const habitId = m.habit!.id as string;
            return (
              <div key={habitId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{m.habit?.name}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {m.completionPct ?? 0}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {OUTCOMES.map((o) => (
                    <ChoiceButton
                      key={o}
                      selected={decisions[habitId] === o}
                      onClick={() =>
                        setDecisions((prev) => ({ ...prev, [habitId]: o }))
                      }
                    >
                      {t(o)}
                    </ChoiceButton>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <Label>{t("notes")}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            rows={3}
          />
        </div>

        <Button
          disabled={!allDecided || !sprintId || complete.isPending}
          onClick={() => {
            if (!sprintId) return;
            complete.mutate({
              sprintId,
              decisions: members.map((m) => ({
                habitId: m.habit!.id as string,
                outcome: decisions[m.habit!.id as string],
              })),
              retroNotes: notes.trim() || null,
            });
          }}
        >
          {complete.isPending && <Spinner className="mr-2 h-4 w-4" />}
          {t("complete")}
        </Button>
      </CardContent>
    </Card>
  );
}

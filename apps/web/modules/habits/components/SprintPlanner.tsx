"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useGetBacklogForPlanningQuery,
  useStartSprintMutation,
} from "@/lib/graphql/generated";
import { invalidateHabitsQueries } from "../utils/invalidate";

const LENGTHS = [1, 2, 3, 4];

export function SprintPlanner() {
  const t = useTranslations("habits.sprint");
  const qc = useQueryClient();
  const { data, isLoading } = useGetBacklogForPlanningQuery();
  const backlog = data?.backlogForPlanning ?? [];

  const [lengthWeeks, setLengthWeeks] = useState(2);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Pre-check habits whose last retro outcome was "carried".
  useEffect(() => {
    if (!data?.backlogForPlanning) return;
    setSelected(
      new Set(
        data.backlogForPlanning
          .filter((b) => b.lastOutcome === "carried" && b.habit?.id)
          .map((b) => b.habit!.id as string)
      )
    );
  }, [data]);

  const start = useStartSprintMutation({
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("startFailed")),
    onSuccess: () => invalidateHabitsQueries(qc),
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <h2 className="text-sm font-medium">{t("planTitle")}</h2>

        <div className="space-y-1.5">
          <Label>{t("length")}</Label>
          <div className="flex gap-2">
            {LENGTHS.map((w) => (
              <Button
                key={w}
                type="button"
                size="sm"
                variant={lengthWeeks === w ? "secondary" : "outline"}
                onClick={() => setLengthWeeks(w)}
              >
                {t("weeks", { count: w })}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("name")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("selectHabits")}</Label>
          {backlog.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noBacklog")}</p>
          ) : (
            <div className="space-y-1">
              {backlog.map((b, i) => {
                const id = b.habit?.id;
                if (!id) return null;
                return (
                  <label
                    key={id ?? i}
                    className="flex items-center gap-2 py-1 text-sm"
                  >
                    <Checkbox
                      checked={selected.has(id)}
                      onCheckedChange={() => toggle(id)}
                      aria-label={b.habit?.name ?? undefined}
                    />
                    <span className="truncate">{b.habit?.name}</span>
                    {b.lastOutcome === "carried" && (
                      <Badge variant="secondary">{t("carriedBadge")}</Badge>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {selected.size > 4 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("wipWarning")}
          </p>
        )}

        <Button
          disabled={selected.size === 0 || start.isPending}
          onClick={() =>
            start.mutate({
              input: {
                lengthWeeks,
                habitIds: [...selected],
                name: name.trim() || null,
              },
            })
          }
        >
          {t("start")}
        </Button>
      </CardContent>
    </Card>
  );
}

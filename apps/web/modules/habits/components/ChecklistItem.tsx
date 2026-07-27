"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useGetDailyChecklistQuery,
  useToggleCheckMutation,
  useToggleSkipMutation,
  useLogSlipMutation,
  useUndoSlipMutation,
  type GetDailyChecklistQuery,
} from "@/lib/graphql/generated";
import { invalidateHabitsQueries } from "../utils/invalidate";
import { HabitHistoryDialog } from "./HabitHistoryDialog";

type Item = NonNullable<GetDailyChecklistQuery["dailyChecklist"]>[number];
type MutationCtx = { previous: GetDailyChecklistQuery | undefined };

export function ChecklistItem({ item, date }: { item: Item; date: string }) {
  const t = useTranslations("habits.today");
  const qc = useQueryClient();
  const listKey = useGetDailyChecklistQuery.getKey({ date });

  /**
   * Optimistic-update factory (Timer.tsx pattern): cancel in-flight
   * refetches, snapshot, patch the targeted checklist row immediately, and
   * hand the snapshot to onError for rollback. onSettled's returned
   * invalidate promise keeps isPending true until fresh data lands.
   */
  const optimistic =
    (patch: (it: Item) => Partial<Item>) =>
    async (variables: { habitId: string; date: string }): Promise<MutationCtx> => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData<GetDailyChecklistQuery>(listKey);
      qc.setQueryData<GetDailyChecklistQuery>(listKey, (old) => {
        if (!old?.dailyChecklist) return old;
        return {
          ...old,
          dailyChecklist: old.dailyChecklist.map((it) =>
            it.habit?.id === variables.habitId ? { ...it, ...patch(it) } : it
          ),
        };
      });
      return { previous };
    };

  const onError = (err: unknown, _vars: unknown, context: MutationCtx | undefined) => {
    if (context?.previous !== undefined) qc.setQueryData(listKey, context.previous);
    toast.error(err instanceof Error ? err.message : t("checkFailed"));
  };
  const onSettled = () => invalidateHabitsQueries(qc);

  const toggle = useToggleCheckMutation<unknown, MutationCtx>({
    onMutate: optimistic((it) => {
      const wasChecked = it.checkedToday ?? false;
      const weekly = it.habit?.frequency === "weekly";
      const delta = wasChecked ? -1 : 1;
      return {
        checkedToday: !wasChecked,
        skippedToday: false,
        thisWeekCount: weekly
          ? Math.max(0, (it.thisWeekCount ?? 0) + delta)
          : it.thisWeekCount,
        streak: weekly ? it.streak : Math.max(0, (it.streak ?? 0) + delta),
      };
    }),
    onError,
    onSettled,
  });
  const toggleSkip = useToggleSkipMutation<unknown, MutationCtx>({
    onMutate: optimistic((it) => {
      const wasSkipped = it.skippedToday ?? false;
      const wasChecked = it.checkedToday ?? false;
      const weekly = it.habit?.frequency === "weekly";
      return {
        skippedToday: !wasSkipped,
        checkedToday: false,
        thisWeekCount:
          wasChecked && weekly
            ? Math.max(0, (it.thisWeekCount ?? 0) - 1)
            : it.thisWeekCount,
        streak:
          wasChecked && !weekly ? Math.max(0, (it.streak ?? 0) - 1) : it.streak,
      };
    }),
    onError,
    onSettled,
  });
  const slip = useLogSlipMutation<unknown, MutationCtx>({
    onMutate: optimistic((it) => ({
      slipCountToday: (it.slipCountToday ?? 0) + 1,
      streak: 0,
    })),
    onError,
    onSettled,
  });
  const undo = useUndoSlipMutation<unknown, MutationCtx>({
    onMutate: optimistic((it) => ({
      slipCountToday: Math.max(0, (it.slipCountToday ?? 0) - 1),
    })),
    onError,
    onSettled,
  });
  const [historyOpen, setHistoryOpen] = useState(false);

  const habit = item.habit;
  const habitId = habit?.id;
  if (!habit || !habitId) return null;

  const checkedToday = item.checkedToday ?? false;
  const skippedToday = item.skippedToday ?? false;
  const thisWeekCount = item.thisWeekCount ?? 0;
  const streak = item.streak ?? 0;
  const slipCountToday = item.slipCountToday ?? 0;
  const attention = item.needsAttention ?? false;

  const isWeekly = habit.frequency === "weekly" && habit.timesPerWeek != null;
  const quotaMet = isWeekly && thisWeekCount >= (habit.timesPerWeek ?? 0);

  return (
    <Card
      size="sm"
      className={(quotaMet && !checkedToday) || skippedToday ? "opacity-60" : undefined}
    >
      <CardContent className="flex items-center gap-3">
        {habit.type === "good" && (
          <Checkbox
            checked={checkedToday}
            disabled={toggle.isPending}
            onCheckedChange={() => toggle.mutate({ habitId, date })}
            aria-label={habit.name ?? undefined}
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="truncate text-left text-sm hover:underline"
              onClick={() => setHistoryOpen(true)}
            >
              {habit.name}
            </button>
            {skippedToday && <Badge variant="outline">{t("skipped")}</Badge>}
            {habit.status === "established" && (
              <Badge variant="secondary">{t("established")}</Badge>
            )}
            {attention && habit.status === "established" && (
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t("needsAttention")}
              </Badge>
            )}
          </div>
          {habit.intention && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{habit.intention}</p>
          )}
          {attention && habit.starter && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {t("tryStarter", { starter: habit.starter })}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {habit.type === "good" && isWeekly && (
            <span>
              {quotaMet
                ? t("quotaMet")
                : t("weekProgress", { done: thisWeekCount, target: habit.timesPerWeek ?? 0 })}
            </span>
          )}
          {habit.type === "good" && (
            <span className="font-mono tabular-nums">
              {isWeekly
                ? t("streakWeeks", { weeks: streak })
                : t("streakDays", { days: streak })}
            </span>
          )}
          {habit.type === "good" && (
            <Button
              variant="ghost"
              size="sm"
              disabled={toggleSkip.isPending}
              className={skippedToday ? "text-primary" : undefined}
              onClick={() => toggleSkip.mutate({ habitId, date })}
            >
              {skippedToday ? t("skipped") : t("skip")}
            </Button>
          )}
          {habit.type === "bad" && (
            <>
              <span className="font-mono tabular-nums">{t("daysClean", { days: streak })}</span>
              {slipCountToday > 0 && (
                <>
                  <span>{t("slipsToday", { count: slipCountToday })}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={undo.isPending}
                    onClick={() => undo.mutate({ habitId, date })}
                  >
                    {t("undo")}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={slip.isPending}
                onClick={() => slip.mutate({ habitId, date })}
              >
                {t("slipped")}
              </Button>
            </>
          )}
        </div>
      </CardContent>
      <HabitHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} habit={habit} />
    </Card>
  );
}

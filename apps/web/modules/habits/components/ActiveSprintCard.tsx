"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDown, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useGetHabitsQuery,
  useAddHabitToSprintMutation,
  useRemoveHabitFromSprintMutation,
  type GetActiveSprintQuery,
} from "@/lib/graphql/generated";
import { invalidateHabitsQueries } from "../utils/invalidate";

type View = NonNullable<GetActiveSprintQuery["activeSprint"]>;

export function ActiveSprintCard({ view }: { view: View }) {
  const t = useTranslations("habits.sprint");
  const ts = useTranslations("habits.strip");
  const qc = useQueryClient();
  const [confirmDropId, setConfirmDropId] = useState<string | null>(null);

  const { data: backlogData } = useGetHabitsQuery({ status: "backlog" });
  const backlog = backlogData?.habits ?? [];
  const members = view.members ?? [];

  const add = useAddHabitToSprintMutation({
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("swapFailed")),
    onSettled: () => invalidateHabitsQueries(qc),
  });
  const remove = useRemoveHabitFromSprintMutation({
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("dropFailed")),
    onSuccess: async () => {
      await invalidateHabitsQueries(qc);
      setConfirmDropId(null);
    },
  });

  const dayNumber = view.dayNumber ?? 0;
  const totalDays = view.totalDays ?? 0;
  const daysLeft = Math.max(0, totalDays - dayNumber);

  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">{view.sprint?.name}</h2>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {ts("day", { day: dayNumber, total: totalDays })} ·{" "}
            {t("daysLeft", { days: daysLeft })}
          </span>
        </div>

        <div className="space-y-3">
          {members.map((m, i) => {
            const habitId = m.habit?.id;
            if (!habitId) return null;
            const pct = m.completionPct ?? 0;
            return (
              <div key={habitId ?? i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{m.habit?.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDropId(habitId)}
                    >
                      {t("drop")}
                    </Button>
                  </span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })}
        </div>

        {backlog.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronDown className="h-3 w-3" />
              {t("swapIn")}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {backlog.map((h, i) => {
                const id = h.id;
                if (!id) return null;
                return (
                  <div key={id ?? i} className="flex items-center justify-between text-sm">
                    <span className="truncate">{h.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={add.isPending}
                      onClick={() => add.mutate({ habitId: id })}
                      aria-label={h.name ?? undefined}
                    >
                      {add.isPending && add.variables?.habitId === id ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        <AlertDialog
          open={confirmDropId !== null}
          onOpenChange={(o) => !o && setConfirmDropId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("dropConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("dropConfirmDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmDropId && remove.mutate({ habitId: confirmDropId })}
              >
                {remove.isPending && <Spinner className="mr-2 h-4 w-4" />}
                {t("drop")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

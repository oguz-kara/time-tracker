"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
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
import { Plus, Pencil, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useGetHabitsQuery,
  useDropHabitMutation,
  type GetHabitsQuery,
} from "@/lib/graphql/generated";
import { invalidateHabitsQueries } from "../utils/invalidate";
import { HabitDialog } from "./HabitDialog";
import { HabitHistoryDialog } from "./HabitHistoryDialog";

type HabitRow = NonNullable<GetHabitsQuery["habits"]>[number];

function HabitLine({
  habit,
  onEdit,
  onDrop,
}: {
  habit: HabitRow;
  onEdit?: (h: HabitRow) => void;
  onDrop?: (h: HabitRow) => void;
}) {
  const t = useTranslations("habits.backlog");
  const [historyOpen, setHistoryOpen] = useState(false);
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="truncate text-left text-sm hover:underline"
              onClick={() => setHistoryOpen(true)}
            >
              {habit.name}
            </button>
            <Badge variant="outline">
              {habit.type === "good" ? t("typeGood") : t("typeBad")}
            </Badge>
            {habit.frequency === "weekly" && habit.timesPerWeek != null && (
              <Badge variant="secondary">{t("weeklyBadge", { n: habit.timesPerWeek })}</Badge>
            )}
          </div>
          {habit.identity && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{habit.identity}</p>
          )}
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(habit)}
            aria-label={habit.name ?? undefined}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {onDrop && (
          <Button variant="ghost" size="sm" onClick={() => onDrop(habit)}>
            {t("dropAction")}
          </Button>
        )}
      </CardContent>
      <HabitHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} habit={habit} />
    </Card>
  );
}

export function BacklogView() {
  const t = useTranslations("habits.backlog");
  const qc = useQueryClient();
  const { data, isLoading } = useGetHabitsQuery({});
  const all = data?.habits ?? [];
  const backlog = all.filter((h) => h.status === "backlog");
  const established = all.filter((h) => h.status === "established");
  const dropped = all.filter((h) => h.status === "dropped");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HabitRow | null>(null);
  const [confirmDrop, setConfirmDrop] = useState<HabitRow | null>(null);

  const drop = useDropHabitMutation({
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("dropFailed")),
    onSuccess: async () => {
      await invalidateHabitsQueries(qc);
      setConfirmDrop(null);
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> {t("add")}
        </Button>
      </div>

      {backlog.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {backlog.map((h, i) => (
            <HabitLine
              key={h.id ?? i}
              habit={h}
              onEdit={(habit) => {
                setEditing(habit);
                setDialogOpen(true);
              }}
              onDrop={setConfirmDrop}
            />
          ))}
        </div>
      )}

      {[
        { key: "establishedSection" as const, items: established, editable: true },
        { key: "droppedSection" as const, items: dropped, editable: false },
      ]
        .filter((s) => s.items.length > 0)
        .map((section) => (
          <Collapsible key={section.key}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <ChevronDown className="h-3 w-3" />
              {t(section.key)} ({section.items.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {section.items.map((h, i) => (
                <HabitLine
                  key={h.id ?? i}
                  habit={h}
                  onEdit={
                    section.editable
                      ? (habit) => {
                          setEditing(habit);
                          setDialogOpen(true);
                        }
                      : undefined
                  }
                  onDrop={section.editable ? setConfirmDrop : undefined}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}

      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editing} />

      <AlertDialog open={confirmDrop !== null} onOpenChange={(o) => !o && setConfirmDrop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dropConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dropConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDrop?.id && drop.mutate({ id: confirmDrop.id })}
            >
              {drop.isPending && <Spinner className="mr-2 h-4 w-4" />}
              {t("dropAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

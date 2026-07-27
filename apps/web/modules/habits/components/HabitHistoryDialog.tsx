"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useGetHabitChecksQuery } from "@/lib/graphql/generated";
import { useTrackingPrefs } from "@/modules/time-tracking/hooks/useTrackingPrefs";
import { addDays, dateKeyInTz, todayKey, weekStartKey } from "../utils/dates";
import { HabitHeatmap } from "./HabitHeatmap";

const WEEKS = 16;

interface HabitLike {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  createdAt?: string | Date | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: HabitLike;
}

export function HabitHistoryDialog({ open, onOpenChange, habit }: Props) {
  const t = useTranslations("habits.history");
  const { tz, weekStartsOn } = useTrackingPrefs();

  const today = todayKey(tz);
  const from = addDays(weekStartKey(today, weekStartsOn), -7 * (WEEKS - 1));
  const habitId = habit.id ?? "";

  const { data, isLoading } = useGetHabitChecksQuery(
    { habitId, from, to: today },
    { enabled: open && habitId !== "" }
  );
  const checks = (data?.habitChecks ?? []).map((c) => ({
    date: c.date ?? "",
    kind: c.kind ?? "",
    count: c.count ?? 1,
  }));

  const createdKey = habit.createdAt
    ? dateKeyInTz(new Date(habit.createdAt), tz)
    : from;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-fit">
        <DialogHeader>
          <DialogTitle>
            {t("title")} — {habit.name}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-24 w-64" />
        ) : (
          <HabitHeatmap
            habitType={habit.type ?? "good"}
            createdKey={createdKey}
            todayKey={today}
            weekStartsOn={weekStartsOn}
            checks={checks}
            weeks={WEEKS}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

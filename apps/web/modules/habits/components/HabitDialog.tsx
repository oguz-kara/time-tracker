"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useCreateHabitMutation,
  useUpdateHabitMutation,
  type GetHabitsQuery,
} from "@/lib/graphql/generated";
import { invalidateHabitsQueries } from "../utils/invalidate";

type HabitRow = NonNullable<GetHabitsQuery["habits"]>[number];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: HabitRow | null;
}

function OptionGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          variant={value === o.value ? "secondary" : "outline"}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export function HabitDialog({ open, onOpenChange, habit }: Props) {
  const t = useTranslations("habits.form");
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState("good");
  const [frequency, setFrequency] = useState("daily");
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [position, setPosition] = useState(0);
  const [intention, setIntention] = useState("");
  const [starter, setStarter] = useState("");
  const [identity, setIdentity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? "");
    setType(habit?.type ?? "good");
    setFrequency(habit?.frequency ?? "daily");
    setTimesPerWeek(habit?.timesPerWeek ?? 3);
    setPosition(habit?.position ?? 0);
    setIntention(habit?.intention ?? "");
    setStarter(habit?.starter ?? "");
    setIdentity(habit?.identity ?? "");
    setNotes(habit?.notes ?? "");
  }, [open, habit]);

  const onError = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : t("saveFailed"));
  const onSuccess = () => {
    invalidateHabitsQueries(qc);
    onOpenChange(false);
  };
  const create = useCreateHabitMutation({ onError, onSuccess });
  const update = useUpdateHabitMutation({ onError, onSuccess });
  const pending = create.isPending || update.isPending;

  const submit = () => {
    const input = {
      name,
      type,
      frequency: type === "bad" ? "daily" : frequency,
      timesPerWeek: type === "good" && frequency === "weekly" ? timesPerWeek : null,
      position,
      intention: intention.trim() || null,
      starter: starter.trim() || null,
      identity: identity.trim() || null,
      notes: notes.trim() || null,
    };
    if (habit?.id) update.mutate({ id: habit.id, input });
    else create.mutate({ input });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{habit ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("type")}</Label>
            <OptionGroup
              value={type}
              onChange={setType}
              options={[
                { value: "good", label: t("typeGood") },
                { value: "bad", label: t("typeBad") },
              ]}
            />
          </div>

          {type === "good" && (
            <div className="space-y-1.5">
              <Label>{t("frequency")}</Label>
              <OptionGroup
                value={frequency}
                onChange={setFrequency}
                options={[
                  { value: "daily", label: t("daily") },
                  { value: "weekly", label: t("weekly") },
                ]}
              />
              {frequency === "weekly" && (
                <div className="flex items-center gap-2 pt-1">
                  <Label className="text-xs">{t("timesPerWeek")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    className="w-20"
                    value={timesPerWeek}
                    onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                  />
                </div>
              )}
              {habit && (
                <p className="text-xs text-muted-foreground">{t("frequencyNote")}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t("intention")}</Label>
            <Input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={t("intentionPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("starter")}</Label>
            <Input
              value={starter}
              onChange={(e) => setStarter(e.target.value)}
              placeholder={t("starterPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("identity")}</Label>
            <Input
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder={t("identityPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">{t("position")}</Label>
            <Input
              type="number"
              className="w-20"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

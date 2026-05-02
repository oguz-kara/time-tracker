"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useCreateEntryMutation,
  useUpdateEntryMutation,
  TimeEntryFieldsFragment,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimeEntryFieldsFragment | null;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditEntryDialog({ open, onOpenChange, entry }: Props) {
  const t = useTranslations("track.dialog");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const isEdit = !!entry;
  const isRunning = isEdit && entry?.stop == null;

  const [start, setStart] = useState("");
  const [stop, setStop] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (entry) {
      setStart(entry.start ? toLocalInput(new Date(entry.start)) : "");
      setStop(entry.stop ? toLocalInput(new Date(entry.stop)) : "");
      setDescription(entry.description ?? "");
    } else {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60_000);
      setStart(toLocalInput(oneHourAgo));
      setStop(toLocalInput(now));
      setDescription("");
    }
  }, [entry?.id, open]);

  const create = useCreateEntryMutation({
    onSuccess: () => {
      qc.invalidateQueries();
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : t("saveFailed")),
  });
  const update = useUpdateEntryMutation({
    onSuccess: () => {
      qc.invalidateQueries();
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : t("saveFailed")),
  });

  const submit = () => {
    const startDate = new Date(start);
    if (isEdit && entry?.id) {
      const patch: { start?: Date; stop?: Date; description?: string | null } = {
        start: startDate,
        description: description || null,
      };
      if (!isRunning && stop) patch.stop = new Date(stop);
      update.mutate({ id: entry.id, input: patch });
    } else if (!isEdit) {
      if (!stop) {
        toast.error(t("stopRequired"));
        return;
      }
      create.mutate({
        input: { start: startDate, stop: new Date(stop), description: description || null },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start">{t("start")}</Label>
            <Input
              id="start"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stop">{isRunning ? t("stopRunning") : t("stop")}</Label>
            <Input
              id="stop"
              type="datetime-local"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

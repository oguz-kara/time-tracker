"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { TagChipInput } from "./TagChipInput";
import {
  useCreateEntryMutation,
  useUpdateEntryMutation,
  TimeEntryFieldsFragment,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { invalidateTimeTrackingQueries } from "../utils/invalidate";
import { DateTimeField } from "./DateTimeField";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimeEntryFieldsFragment | null;
}

export function EditEntryDialog({ open, onOpenChange, entry }: Props) {
  const t = useTranslations("track.dialog");
  const tc = useTranslations("common");
  const tTags = useTranslations("track.tags");
  const qc = useQueryClient();
  const isEdit = !!entry;
  const isRunning = isEdit && entry?.stop == null;

  // Date objects, not strings. Lets us pass directly to mutations and to
  // <DateTimeField> without parsing back and forth.
  const [start, setStart] = useState<Date | null>(null);
  const [stop, setStop] = useState<Date | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (entry) {
      setStart(entry.start ? new Date(entry.start) : null);
      setStop(entry.stop ? new Date(entry.stop) : null);
      setDescription(entry.description ?? "");
      setTags((entry.tags ?? []).filter((t): t is string => !!t));
    } else {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60_000);
      setStart(oneHourAgo);
      setStop(now);
      setDescription("");
      setTags([]);
    }
  }, [entry?.id, open]);

  // Await the refetch before closing: the save button's spinner covers the
  // whole round-trip, so the entry list is already fresh when the dialog
  // closes (no post-close pop-in).
  const create = useCreateEntryMutation({
    onSuccess: async () => {
      await invalidateTimeTrackingQueries(qc);
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : t("saveFailed")),
  });
  const update = useUpdateEntryMutation({
    onSuccess: async () => {
      await invalidateTimeTrackingQueries(qc);
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : t("saveFailed")),
  });

  const submit = () => {
    if (!start) {
      toast.error(t("saveFailed"));
      return;
    }
    if (isEdit && entry?.id) {
      const patch: {
        start?: Date;
        stop?: Date;
        description?: string | null;
        tags?: string[];
      } = {
        start,
        description: description || null,
        tags,
      };
      if (!isRunning && stop) patch.stop = stop;
      update.mutate({ id: entry.id, input: patch });
    } else if (!isEdit) {
      if (!stop) {
        toast.error(t("stopRequired"));
        return;
      }
      create.mutate({
        input: { start, stop, description: description || null, tags },
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
            <DateTimeField
              id="start"
              value={start}
              onChange={setStart}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stop">{isRunning ? t("stopRunning") : t("stop")}</Label>
            <DateTimeField
              id="stop"
              value={stop}
              onChange={setStop}
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">{tTags("label")}</Label>
            <TagChipInput id="tags" value={tags} onChange={setTags} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {(create.isPending || update.isPending) && (
              <Spinner className="mr-2 h-4 w-4" />
            )}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

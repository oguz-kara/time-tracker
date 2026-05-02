"use client";

import { useState } from "react";
import {
  useGetEntriesQuery,
  useGetUserSettingsQuery,
  useDeleteEntryMutation,
  TimeEntryFieldsFragment,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { todayRange, formatTimeOfDay, formatMinutes } from "../utils/format";
import { EditEntryDialog } from "./EditEntryDialog";
import { useUserTimezone } from "../hooks/useUserTimezone";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function EntryList() {
  const t = useTranslations("track.entries");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  useGetUserSettingsQuery();
  const tz = useUserTimezone();
  const { from, to } = todayRange(tz);
  const { data, isLoading } = useGetEntriesQuery({ from, to });

  const [editing, setEditing] = useState<TimeEntryFieldsFragment | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const del = useDeleteEntryMutation({
    onSuccess: () => {
      qc.invalidateQueries();
      setPendingDelete(null);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : tc("failed")),
  });

  const entries = data?.entries ?? [];

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-sm font-medium">{t("title")}</h2>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("addEntry")}
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2 p-4">
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-8 animate-pulse rounded bg-muted" />
        </div>
      ) : entries.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((e) => {
            const startMs = e.start ? new Date(e.start).getTime() : Date.now();
            const stopMs = e.stop ? new Date(e.stop).getTime() : Date.now();
            const minutes = Math.round((stopMs - startMs) / 60_000);
            const running = e.stop == null;
            return (
              <li
                key={e.id ?? String(startMs)}
                className="flex items-center gap-3 p-3 text-sm"
              >
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {e.start ? formatTimeOfDay(new Date(e.start), tz) : "—"} →{" "}
                  {running
                    ? t("now")
                    : e.stop
                    ? formatTimeOfDay(new Date(e.stop), tz)
                    : "—"}
                </span>
                <span className="w-16 font-mono text-xs tabular-nums">
                  {formatMinutes(minutes)}
                </span>
                <span className="flex-1 truncate">
                  {e.description || <span className="text-muted-foreground">—</span>}
                </span>
                <Button size="icon" variant="ghost" onClick={() => setEditing(e)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {!running && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => e.id && setPendingDelete(e.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <EditEntryDialog
        open={!!editing || creating}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setCreating(false);
          }
        }}
        entry={editing}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && del.mutate({ id: pendingDelete })}
              disabled={del.isPending}
            >
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
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
import { invalidateTimeTrackingQueries } from "../utils/invalidate";
import { USE_MOCK_TIME_DATA } from "../mocks/daily-totals";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function EntryList() {
  const t = useTranslations("track.entries");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  useGetUserSettingsQuery();
  const tz = useUserTimezone();
  const { from, to } = todayRange(tz);
  // Don't fire the real query while mocks are on — keeps the empty-list
  // state from contradicting the chart (which uses mock entries).
  const { data, isLoading } = useGetEntriesQuery(
    { from, to },
    { enabled: !USE_MOCK_TIME_DATA }
  );

  const [editing, setEditing] = useState<TimeEntryFieldsFragment | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const del = useDeleteEntryMutation({
    onSuccess: () => {
      invalidateTimeTrackingQueries(qc);
      setPendingDelete(null);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : tc("failed")),
  });

  const entries = data?.entries ?? [];

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("addEntry")}
        </Button>
      </CardHeader>
      <CardContent className="!p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>{t("empty")}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader className="sr-only">
              <TableRow>
                <TableHead>{t("title")}</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => {
                const startMs = e.start ? new Date(e.start).getTime() : Date.now();
                const stopMs = e.stop ? new Date(e.stop).getTime() : Date.now();
                const minutes = Math.round((stopMs - startMs) / 60_000);
                const running = e.stop == null;
                return (
                  <TableRow key={e.id ?? String(startMs)}>
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                      {e.start ? formatTimeOfDay(new Date(e.start), tz) : "—"} →{" "}
                      {running
                        ? t("now")
                        : e.stop
                        ? formatTimeOfDay(new Date(e.stop), tz)
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums w-16 whitespace-nowrap">
                      {formatMinutes(minutes)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="block max-w-xs truncate" title={e.description ?? undefined}>
                        {e.description || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing(e)}
                        aria-label={tc("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!running && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={tc("delete")}
                          onClick={() => e.id && setPendingDelete(e.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

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
              {del.isPending && <Spinner className="mr-2 h-4 w-4" />}
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

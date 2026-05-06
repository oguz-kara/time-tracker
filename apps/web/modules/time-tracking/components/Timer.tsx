"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Square } from "lucide-react";
import {
  useGetCurrentEntryQuery,
  useStartTimerMutation,
  useStopTimerMutation,
  type GetCurrentEntryQuery,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { formatElapsed } from "../utils/format";
import { invalidateTimeTrackingQueries } from "../utils/invalidate";
import { toast } from "sonner";

const CURRENT_ENTRY_KEY = useGetCurrentEntryQuery.getKey();

export function Timer() {
  const t = useTranslations("track.timer");
  const qc = useQueryClient();
  const { data, isLoading } = useGetCurrentEntryQuery();
  const running = data?.currentEntry ?? null;

  const [description, setDescription] = useState("");
  useEffect(() => {
    setDescription(running?.description ?? "");
  }, [running?.id]);

  // Hydration-safe: server and first client render both produce 0. The
  // interval below sets a real value on mount, so the live counter starts
  // ticking immediately after hydration without diverging from SSR markup.
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    if (!running) {
      setNow(0);
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running?.id]);

  const elapsed =
    running?.start && now > 0 ? now - new Date(running.start).getTime() : 0;

  const start = useStartTimerMutation<unknown, { previous: GetCurrentEntryQuery | undefined }>({
    onMutate: async (variables) => {
      // Cancel any in-flight refetch so it doesn't overwrite our optimistic value
      await qc.cancelQueries({ queryKey: CURRENT_ENTRY_KEY });
      const previous = qc.getQueryData<GetCurrentEntryQuery>(CURRENT_ENTRY_KEY);

      // Synthesize an optimistic running entry. Real ids/timestamps from the
      // server arrive via onSettled invalidation.
      const optimistic: GetCurrentEntryQuery = {
        currentEntry: {
          __typename: "TimeEntry",
          id: "optimistic-start",
          start: new Date().toISOString(),
          stop: null,
          description: variables?.input?.description ?? null,
          tags: variables?.input?.tags ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      qc.setQueryData<GetCurrentEntryQuery>(CURRENT_ENTRY_KEY, optimistic);
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(CURRENT_ENTRY_KEY, context.previous);
      }
      toast.error(err instanceof Error ? err.message : t("failedToStart"));
    },
    onSettled: () => {
      invalidateTimeTrackingQueries(qc);
    },
  });

  const stop = useStopTimerMutation<unknown, { previous: GetCurrentEntryQuery | undefined }>({
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: CURRENT_ENTRY_KEY });
      const previous = qc.getQueryData<GetCurrentEntryQuery>(CURRENT_ENTRY_KEY);

      // Optimistically clear the running entry
      qc.setQueryData<GetCurrentEntryQuery>(CURRENT_ENTRY_KEY, { currentEntry: null });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(CURRENT_ENTRY_KEY, context.previous);
      }
      toast.error(err instanceof Error ? err.message : t("failedToStop"));
    },
    onSettled: () => {
      invalidateTimeTrackingQueries(qc);
    },
  });

  if (isLoading) return <Skeleton className="h-16 w-full" />;

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        {running ? (
          <Button
            size="lg"
            variant="destructive"
            onClick={() => stop.mutate({})}
            disabled={stop.isPending}
          >
            <Square className="mr-2 h-4 w-4" /> {t("stop")}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() =>
              start.mutate({ input: { description: description || null } })
            }
            disabled={start.isPending}
          >
            <Play className="mr-2 h-4 w-4" /> {t("start")}
          </Button>
        )}

        <Input
          placeholder={t("placeholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1"
        />

        {running && (
          <div className="font-mono text-2xl tabular-nums tracking-tight">
            {formatElapsed(elapsed)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

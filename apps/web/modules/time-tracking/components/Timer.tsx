"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running?.id]);

  const elapsed = useMemo(() => {
    if (!running?.start) return 0;
    return now - new Date(running.start).getTime();
  }, [running?.id, now]);

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
      qc.invalidateQueries();
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
      qc.invalidateQueries();
    },
  });

  if (isLoading) return <div className="h-16 animate-pulse rounded-md bg-muted" />;

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
      {running ? (
        <Button
          size="lg"
          variant="destructive"
          onClick={() => stop.mutate({})}
        >
          <Square className="mr-2 h-4 w-4" /> {t("stop")}
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={() => start.mutate({ input: { description: description || null } })}
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
    </div>
  );
}

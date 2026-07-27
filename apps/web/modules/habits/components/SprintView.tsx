"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useGetActiveSprintQuery } from "@/lib/graphql/generated";
import { SprintPlanner } from "./SprintPlanner";
import { ActiveSprintCard } from "./ActiveSprintCard";
import { RetroFlow } from "./RetroFlow";
import { SprintHistoryList } from "./SprintHistoryList";

export function SprintView() {
  const { data, isLoading } = useGetActiveSprintQuery();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  const view = data?.activeSprint ?? null;

  return (
    <div className="space-y-6">
      {!view ? (
        <SprintPlanner />
      ) : view.isPastEnd ? (
        <RetroFlow view={view} />
      ) : (
        <ActiveSprintCard view={view} />
      )}
      <SprintHistoryList />
    </div>
  );
}

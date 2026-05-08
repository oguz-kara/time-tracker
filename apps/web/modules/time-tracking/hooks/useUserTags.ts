"use client";

import { useMemo } from "react";
import { useGetUserTagsQuery } from "@/lib/graphql/generated";
import {
  USE_MOCK_TIME_DATA,
  getMockUserTags,
} from "../mocks/daily-totals";

/**
 * The user's distinct tags, sorted. Returns mock data when the mock toggle
 * is on, otherwise hits the `userTags` GraphQL query.
 *
 * Centralizing the mock-toggle pattern here keeps `TagFilter` and
 * `TagChipInput` from drifting on the same three-line dance.
 */
export function useUserTags(): string[] {
  const { data } = useGetUserTagsQuery(undefined, {
    enabled: !USE_MOCK_TIME_DATA,
  });

  return useMemo(() => {
    if (USE_MOCK_TIME_DATA) return getMockUserTags();
    return (data?.userTags ?? []).filter((x): x is string => !!x);
  }, [data?.userTags]);
}

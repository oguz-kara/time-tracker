"use client";

import { useGetUserSettingsQuery } from "@/lib/graphql/generated";
import { useUserTimezone } from "./useUserTimezone";

/**
 * Centralized read of the three tracking preferences a UI component
 * typically needs at once: timezone, daily goal, and week-start day.
 *
 * Internally `useUserTimezone` already calls `useGetUserSettingsQuery` (and
 * adds an SSR-safe browser-tz fallback), so this hook adds zero extra
 * network requests — it just collapses the repetitive
 * `useGetUserSettingsQuery + manual destructuring` boilerplate that was
 * scattered across components.
 */
export function useTrackingPrefs(): {
  tz: string;
  goal: number;
  weekStartsOn: 0 | 1;
} {
  const { data } = useGetUserSettingsQuery();
  const tz = useUserTimezone();
  return {
    tz,
    goal: data?.userSettings?.dailyGoalMinutes ?? 480,
    weekStartsOn: (data?.userSettings?.weekStartsOn ?? 1) as 0 | 1,
  };
}

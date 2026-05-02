"use client";

import { useGetUserSettingsQuery } from "@/lib/graphql/generated";

/**
 * Detect the browser's IANA timezone. Server-render returns "UTC" so the
 * markup is stable; the real value lands on first client render.
 */
function getBrowserTimezone(): string {
  if (typeof Intl === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Returns the user's preferred timezone. Falls back to the browser's tz
 * (rather than "UTC") when settings haven't loaded yet or aren't configured.
 *
 * This matters because `user_settings.timezone` defaults to "UTC" on
 * auto-creation, so a brand-new user's chart would render bars at the wrong
 * hour until they manually saved their tz on the settings page.
 */
export function useUserTimezone(): string {
  const { data } = useGetUserSettingsQuery();
  const stored = data?.userSettings?.timezone;
  // Treat the auto-default "UTC" as "not yet set" and prefer the browser's
  // tz unless the user genuinely lives in UTC.
  if (stored && stored !== "UTC") return stored;
  return getBrowserTimezone();
}

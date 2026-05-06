"use client";

import { useEffect, useState } from "react";
import { useGetUserSettingsQuery } from "@/lib/graphql/generated";

/**
 * Detect the browser's IANA timezone. NOT safe to call during SSR — server
 * `Intl.DateTimeFormat()` returns the *server's* tz (often UTC in containers,
 * but not guaranteed), so calling it at render time produces a hydration
 * mismatch. We resolve it inside an effect after the client mounts.
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
 * Returns the user's preferred timezone. Resolution order, with hydration
 * safety:
 *   1. SSR + first client render → "UTC" (deterministic, matches server)
 *   2. After mount → user_settings.timezone if explicitly set (≠ "UTC")
 *   3. Otherwise → browser's resolved tz
 *
 * Why "UTC" first: `Intl.DateTimeFormat().resolvedOptions().timeZone` runs on
 * the server too (returns host tz) and would diverge from the client. To
 * keep React's hydration check happy we render "UTC" once, then upgrade.
 *
 * Edge case: a user actually in UTC who saved that as their preference will
 * fall through to the browser tz — acceptable for v1, document if it bites.
 */
export function useUserTimezone(): string {
  const { data } = useGetUserSettingsQuery();
  const stored = data?.userSettings?.timezone;

  const [browserTz, setBrowserTz] = useState<string>("UTC");
  useEffect(() => {
    setBrowserTz(getBrowserTimezone());
  }, []);

  if (stored && stored !== "UTC") return stored;
  return browserTz;
}

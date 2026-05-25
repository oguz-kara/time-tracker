"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { periodRange, type Granularity } from "../utils/format";
import { useTrackingPrefs } from "./useTrackingPrefs";

const PARAM_G = "g";
const PARAM_A = "a";

function isGranularity(v: string | null): v is Granularity {
  return v === "week" || v === "month";
}

/** Parse YYYY-MM-DD as UTC noon — tz-shift-safe for anchoring. */
function parseAnchor(raw: string | null): Date {
  if (!raw) return new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return new Date();
  return new Date(`${raw}T12:00:00Z`);
}

/** Format a Date as YYYY-MM-DD (UTC) for URL persistence. */
function formatAnchor(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Shift `anchor` by one period in the given direction, in `tz`. */
function stepAnchor(
  anchor: Date,
  granularity: Granularity,
  direction: 1 | -1,
  tz: string
): Date {
  if (granularity === "week") {
    return new Date(anchor.getTime() + direction * 7 * 24 * 60 * 60 * 1000);
  }
  // Month step: walk calendar-month arithmetic in tz so Feb (28/29 days)
  // doesn't get skipped by a flat ±31-day shift.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(anchor);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const nextM = m + direction;
  let ny = y;
  let nm = nextM;
  if (nm < 1) {
    ny = y - 1;
    nm = 12;
  } else if (nm > 12) {
    ny = y + 1;
    nm = 1;
  }
  // Anchor at the 1st of the target month at UTC noon — periodRange will
  // recompute the actual [from, to) window from this.
  return new Date(`${ny}-${String(nm).padStart(2, "0")}-01T12:00:00Z`);
}

export interface PeriodState {
  granularity: Granularity;
  anchor: Date;
  range: { from: Date; to: Date };
  setGranularity: (next: Granularity) => void;
  setAnchor: (next: Date) => void;
  prev: () => void;
  next: () => void;
  goToday: () => void;
}

/**
 * URL-backed `{granularity, anchor}` state. Both live in `?g=` and `?a=` so
 * navigation survives reload, browser back/forward, and is shareable.
 *
 * `range` is derived from `(granularity, anchor, tz, weekStartsOn)` via
 * `periodRange` — call sites never compute this themselves.
 */
export function usePeriodState(): PeriodState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tz, weekStartsOn } = useTrackingPrefs();

  const rawG = searchParams.get(PARAM_G);
  const rawA = searchParams.get(PARAM_A);

  const granularity: Granularity = isGranularity(rawG) ? rawG : "week";
  const anchor = useMemo(() => parseAnchor(rawA), [rawA]);

  const range = useMemo(
    () => periodRange(granularity, anchor, tz, weekStartsOn),
    [granularity, anchor, tz, weekStartsOn]
  );

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setGranularity = useCallback(
    (next: Granularity) => {
      push((p) => {
        if (next === "week") p.delete(PARAM_G);
        else p.set(PARAM_G, next);
      });
    },
    [push]
  );

  const setAnchor = useCallback(
    (next: Date) => {
      push((p) => p.set(PARAM_A, formatAnchor(next)));
    },
    [push]
  );

  const prev = useCallback(() => {
    setAnchor(stepAnchor(anchor, granularity, -1, tz));
  }, [setAnchor, anchor, granularity, tz]);

  const next = useCallback(() => {
    setAnchor(stepAnchor(anchor, granularity, 1, tz));
  }, [setAnchor, anchor, granularity, tz]);

  const goToday = useCallback(() => {
    push((p) => {
      p.delete(PARAM_A);
    });
  }, [push]);

  return {
    granularity,
    anchor,
    range,
    setGranularity,
    setAnchor,
    prev,
    next,
    goToday,
  };
}

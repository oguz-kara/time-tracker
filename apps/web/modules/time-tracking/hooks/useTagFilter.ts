"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const PARAM = "tag";

/**
 * URL-backed single-tag filter state. The active tag lives in `?tag=...` so
 * it survives reload, browser back/forward, and is shareable. Returns a
 * tuple matching `useState`'s shape so call sites read identically:
 *
 *   const [activeTag, setActiveTag] = useTagFilter();
 *
 * Setting `null` removes the param; setting a string upserts it.
 */
export function useTagFilter(): [string | null, (next: string | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(PARAM);

  const setValue = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set(PARAM, next);
      } else {
        params.delete(PARAM);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return [value, setValue];
}

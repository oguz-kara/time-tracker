"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserTags } from "../hooks/useUserTags";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  id?: string;
}

/**
 * Multi-tag chip input. Type → Enter (or comma) commits a chip. Backspace
 * with empty input removes the last chip. Autocomplete suggestions come
 * from `useGetUserTagsQuery` and are filtered by current input.
 *
 * Tags are normalized to lowercase + trimmed; duplicates within a single
 * entry are silently deduplicated.
 */
export function TagChipInput({ value, onChange, id }: Props) {
  const t = useTranslations("track.tags");
  const tc = useTranslations("common");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const knownTags = useUserTags();

  // Suggestions: known tags that match the draft and aren't already on
  // the entry. Capped at 6.
  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    const lowerValue = value.map((v) => v.toLowerCase());
    return knownTags
      .filter(
        (tag) =>
          tag.toLowerCase().startsWith(q) &&
          !lowerValue.includes(tag.toLowerCase())
      )
      .slice(0, 6);
  }, [draft, knownTags, value]);

  const commit = (raw: string) => {
    const clean = raw.trim().toLowerCase();
    if (!clean) return;
    if (value.map((v) => v.toLowerCase()).includes(clean)) {
      setDraft("");
      return;
    }
    onChange([...value, clean]);
    setDraft("");
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-input px-2 py-1.5",
          "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
        )}
      >
        {value.map((tag, idx) => (
          <Badge
            key={tag}
            variant="secondary"
            className="font-mono text-[11px] tracking-tight"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label={tc("aria.removeTag", { tag })}
              className="ml-1 rounded-sm opacity-60 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (
              e.key === "Backspace" &&
              draft === "" &&
              value.length > 0
            ) {
              e.preventDefault();
              remove(value.length - 1);
            }
          }}
          onBlur={() => {
            // Commit any in-flight draft on blur so users don't lose work
            // by clicking Save without pressing Enter first.
            if (draft.trim()) commit(draft);
          }}
          placeholder={value.length === 0 ? t("addPlaceholder") : ""}
          className="h-7 flex-1 min-w-[120px] border-0 bg-transparent p-0 px-1 text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              // onMouseDown + preventDefault so the input never blurs when
              // the user clicks a suggestion. Without this, blur fires first
              // and onBlur commits the partial draft, then onClick commits
              // the full suggestion → both end up in the tag list.
              onMouseDown={(e) => {
                e.preventDefault();
                setDraft("");
                commit(s);
              }}
              className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

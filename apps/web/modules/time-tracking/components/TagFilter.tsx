"use client";

import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserTags } from "../hooks/useUserTags";

interface Props {
  value: string | null;
  onChange: (next: string | null) => void;
}

const ALL_SENTINEL = "__all__";

/**
 * Single-select tag filter. Backed by `userTags` query for the option list,
 * controlled by URL params via `useTagFilter` (caller provides value/onChange).
 *
 * Renders nothing when the user has zero tags ever — no sense showing a
 * filter that can only show "All."
 */
export function TagFilter({ value, onChange }: Props) {
  const t = useTranslations("track.tags");
  const tags = useUserTags();

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
      <Select
        value={value ?? ALL_SENTINEL}
        onValueChange={(next) =>
          onChange(next === ALL_SENTINEL ? null : next)
        }
      >
        <SelectTrigger
          className="h-8 w-[180px] text-sm"
          aria-label={t("filter")}
        >
          <SelectValue placeholder={t("filter")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SENTINEL}>{t("all")}</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

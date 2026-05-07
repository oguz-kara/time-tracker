"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocaleAction } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const labels: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
};

const shortLabels: Record<Locale, string> = {
  en: "EN",
  tr: "TR",
};

interface Props {
  /** "compact" = mono pill (sidebar / landing header). "full" = labelled trigger. */
  variant?: "compact" | "full";
  className?: string;
}

export function LanguageSwitcher({ variant = "compact", className }: Props) {
  const tc = useTranslations("common");
  const current = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onPick = (next: Locale) => {
    if (next === current) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-mono text-[10px] uppercase tracking-[0.18em] transition-colors disabled:opacity-60",
              variant === "compact"
                ? "border border-border bg-card px-2.5 py-1 text-muted-foreground hover:text-foreground"
                : "px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground",
              className
            )}
            aria-label={tc("aria.changeLanguage")}
          />
        }
      >
        <Languages className="h-3 w-3" />
        {variant === "compact" ? shortLabels[current] : labels[current]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => onPick(l)}
            className={cn(
              "cursor-pointer text-sm",
              l === current && "text-foreground"
            )}
          >
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {shortLabels[l]}
            </span>
            {labels[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

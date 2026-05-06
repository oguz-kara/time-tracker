"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  InputGroup,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { setLocaleAction } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { invalidateTimeTrackingQueries } from "@/modules/time-tracking/utils/invalidate";

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [
        "UTC",
        "America/New_York",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Istanbul",
        "Asia/Tokyo",
      ];

export function SettingsForm() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const { data, isLoading } = useGetUserSettingsQuery();

  const router = useRouter();
  const [, startTransition] = useTransition();

  const [goal, setGoal] = useState(480);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);
  const [timezone, setTimezone] = useState("UTC");
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const s = data?.userSettings;
    if (s) {
      setGoal(s.dailyGoalMinutes ?? 480);
      setWeekStartsOn(((s.weekStartsOn ?? 1) as 0 | 1));
      setTimezone(s.timezone ?? "UTC");
      const storedLocale = s.locale as Locale | undefined;
      if (storedLocale && locales.includes(storedLocale)) {
        setLocale(storedLocale);
      }
    }
  }, [data?.userSettings]);

  const update = useUpdateUserSettingsMutation({
    onSuccess: () => {
      invalidateTimeTrackingQueries(qc);
      toast.success(t("saved"));
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : t("saveFailed")),
  });

  const goalHint = useMemo(() => {
    const h = Math.floor(goal / 60);
    const m = goal % 60;
    return `${h}h ${m}m`;
  }, [goal]);

  if (isLoading) return <Skeleton className="h-64 w-full max-w-md" />;

  return (
    <form
      className="max-w-md space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        // Goal/timezone/weekStartsOn → GraphQL mutation.
        // Locale → server action (writes BOTH cookie and DB row, so we don't
        // double-write here). Splitting avoids the race where a failed
        // mutation would leave the cookie flipped to a locale never persisted.
        update.mutate({
          input: { dailyGoalMinutes: goal, weekStartsOn, timezone },
        });
        startTransition(async () => {
          await setLocaleAction(locale);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="goal">{t("dailyGoal")}</Label>
        <InputGroup>
          <InputGroupInput
            id="goal"
            type="number"
            min={1}
            max={1440}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
          <InputGroupText>min</InputGroupText>
        </InputGroup>
        <p className="text-xs text-muted-foreground">{goalHint}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="week">{t("weekStartsOn")}</Label>
        <Select
          value={String(weekStartsOn)}
          onValueChange={(v) => setWeekStartsOn(Number(v) as 0 | 1)}
        >
          <SelectTrigger id="week" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t("sunday")}</SelectItem>
            <SelectItem value="1">{t("monday")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tz">{t("timezone")}</Label>
        <Combobox
          items={TIMEZONES}
          value={timezone}
          onValueChange={(v) => typeof v === "string" && setTimezone(v)}
        >
          <ComboboxInput id="tz" placeholder={timezone} />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>—</ComboboxEmpty>
              {TIMEZONES.map((tz) => (
                <ComboboxItem key={tz} value={tz}>
                  {tz}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locale">{t("language")}</Label>
        <Select
          value={locale}
          onValueChange={(v) => setLocale(v as Locale)}
        >
          <SelectTrigger id="locale" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t("languageEn")}</SelectItem>
            <SelectItem value="tr">{t("languageTr")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={update.isPending}>
        {update.isPending && <Spinner className="mr-2 h-4 w-4" />}
        {tc("save")}
      </Button>
    </form>
  );
}

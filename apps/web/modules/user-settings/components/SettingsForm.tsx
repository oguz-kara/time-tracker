"use client";

import { useState, useEffect } from "react";
import {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { setLocaleAction } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

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
      qc.invalidateQueries();
      toast.success(t("saved"));
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : t("saveFailed")),
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-md bg-muted" />;

  return (
    <form
      className="max-w-md space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate({
          input: { dailyGoalMinutes: goal, weekStartsOn, timezone, locale },
        });
        // Sync the locale cookie + re-render the layout so the language flips
        // immediately, even though the GraphQL mutation also persists to DB.
        startTransition(async () => {
          await setLocaleAction(locale);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="goal">{t("dailyGoal")}</Label>
        <Input
          id="goal"
          type="number"
          min={1}
          max={1440}
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          {Math.floor(goal / 60)}h {goal % 60}m
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="week">{t("weekStartsOn")}</Label>
        <select
          id="week"
          className="block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
          value={weekStartsOn}
          onChange={(e) => setWeekStartsOn(Number(e.target.value) as 0 | 1)}
        >
          <option value={0}>{t("sunday")}</option>
          <option value={1}>{t("monday")}</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tz">{t("timezone")}</Label>
        <select
          id="tz"
          className="block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="locale">{t("language")}</Label>
        <select
          id="locale"
          className="block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          <option value="en">{t("languageEn")}</option>
          <option value="tr">{t("languageTr")}</option>
        </select>
      </div>
      <Button type="submit" disabled={update.isPending}>
        {tc("save")}
      </Button>
    </form>
  );
}

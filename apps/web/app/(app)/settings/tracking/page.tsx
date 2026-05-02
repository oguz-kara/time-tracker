"use client";

import { useTranslations } from "next-intl";
import { SettingsForm } from "@/modules/user-settings/components/SettingsForm";

export default function TrackingSettingsPage() {
  const t = useTranslations("settings");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-heading font-medium">{t("title")}</h1>
      <SettingsForm />
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/client";
import { StatsStrip } from "@/modules/time-tracking/components/StatsStrip";
import { DailyTotalsChart } from "@/modules/time-tracking/components/DailyTotalsChart";
import { TodayHourlyChart } from "@/modules/time-tracking/components/TodayHourlyChart";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("dashboard.charts");
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-heading font-medium tracking-tight">
          {firstName ? t("greetingNamed", { name: firstName }) : t("greeting")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <StatsStrip />

      <TodayHourlyChart />

      <DailyTotalsChart
        days={30}
        title={tc("thirtyTitle")}
        description={tc("thirtySub")}
      />

      <DailyTotalsChart
        days={7}
        title={tc("weekTitle")}
        description={tc("weekSub")}
      />
    </div>
  );
}

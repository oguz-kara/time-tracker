"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/client";
import { StatsStrip } from "@/modules/time-tracking/components/StatsStrip";
import { DailyTotalsChart } from "@/modules/time-tracking/components/DailyTotalsChart";
import { EntriesByTagChart } from "@/modules/time-tracking/components/EntriesByTagChart";
import { TodayHourlyChart } from "@/modules/time-tracking/components/TodayHourlyChart";
import { PeriodNavigator } from "@/modules/time-tracking/components/PeriodNavigator";
import { TagBreakdownCard } from "@/modules/time-tracking/components/TagBreakdownCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriodState } from "@/modules/time-tracking/hooks/usePeriodState";
import { useTagFilter } from "@/modules/time-tracking/hooks/useTagFilter";

/**
 * The range-aware section reads `?g=&a=&tag=` via `useSearchParams`, so it
 * must live below a Suspense boundary for App Router's static analysis.
 */
function RangeSection() {
  const tc = useTranslations("dashboard.charts");
  const { granularity, range, anchor, setGranularity, setAnchor, prev, next } =
    usePeriodState();
  const [activeTag, setActiveTag] = useTagFilter();

  return (
    <div className="space-y-4">
      <PeriodNavigator
        granularity={granularity}
        range={range}
        anchor={anchor}
        onGranularityChange={setGranularity}
        onAnchorChange={setAnchor}
        onPrev={prev}
        onNext={next}
      />

      {activeTag ? (
        <EntriesByTagChart
          range={range}
          tag={activeTag}
          title={tc("rangeTitleTagged", { tag: activeTag })}
          description={tc("rangeSubTagged")}
        />
      ) : (
        <DailyTotalsChart
          range={range}
          title={tc("rangeTitle")}
          description={tc("rangeSub")}
        />
      )}

      <TagBreakdownCard
        range={range}
        activeTag={activeTag}
        onTagClick={setActiveTag}
      />
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-heading font-medium tracking-tight">
          {firstName ? t("greetingNamed", { name: firstName }) : t("greeting")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <StatsStrip />

      <TodayHourlyChart />

      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <RangeSection />
      </Suspense>
    </div>
  );
}

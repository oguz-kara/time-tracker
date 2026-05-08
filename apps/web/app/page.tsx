import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LandingHeader } from "@/components/layout/landing-header";
import { LiveClock } from "@/components/landing/live-clock";

export const dynamic = "force-dynamic";

// Landing page uses the root metadata `title.default` — the only override
// here is a richer description tuned for search-result CTR.
export const metadata: Metadata = {
  description:
    "Evden çalışırken günün nasıl geçtiğini bilmek istersin. DenTracker; başlat–durdur, mola sayısı ve günlük 8 saat hedefi. Reklam yok, ücretsiz.",
  alternates: {
    canonical: "/",
  },
};

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Atmospheric background — single radial wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(800px 500px at 78% 22%, hsl(var(--aether-blue) / 0.16), transparent 65%), radial-gradient(700px 400px at 12% 80%, hsl(var(--deep-violet) / 0.10), transparent 60%)",
        }}
      />

      {/* CAD-style dotted grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--storm-cloud) / 0.55) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        }}
      />

      {/* Subtle grain — dataURI, no asset deps */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <LandingHeader />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        <section className="flex flex-1 flex-col justify-center pt-24 pb-16">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            {/* LEFT — text */}
            <div>
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-8 bg-foreground/40" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t("eyebrow")}
                </span>
              </div>

              <h1 className="text-[44px] font-medium leading-[0.96] tracking-[-0.04em] sm:text-[56px] md:text-[68px] lg:text-[76px]">
                <span className="block">{t("headlineTop")}</span>
                <span className="block text-muted-foreground">
                  {t("headlineBottom")}
                </span>
              </h1>

              <p className="mt-8 max-w-md text-[15px] leading-[1.55] text-muted-foreground">
                {t("subtitle")}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[14px] font-medium text-primary-foreground shadow-linear-sm transition-transform hover:-translate-y-px"
                >
                  {t("cta")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-[14px] font-medium text-foreground/85 transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {tc("signIn")}
                </Link>
              </div>

              <p className="mt-6 font-mono text-[11px] tracking-tight text-muted-foreground">
                {t("footnote")}
              </p>
            </div>

            {/* RIGHT — live timer card, the actual product surface */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-md border border-foreground/[0.06]" />

              <div className="relative rounded-md border border-border bg-card/80 shadow-linear-xl backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-border/80 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_2px_hsl(var(--primary)/0.45)]" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {t("card.running")}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] tracking-tight text-muted-foreground">
                    {t("card.todayProgress")}
                  </span>
                </div>

                <div className="px-6 py-10 text-center">
                  <div className="text-[clamp(48px,8vw,84px)] leading-none text-foreground">
                    <LiveClock />
                  </div>
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t("card.focusBlock")}
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "67%" }}
                    />
                  </div>
                </div>

                <div className="border-t border-border/80 px-5 py-3">
                  <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
                    <span>09:00 → 11:30</span>
                    <span>2h 30m</span>
                    <span className="text-foreground/70">{t("card.deepWork")}</span>
                  </div>
                </div>
                <div className="border-t border-border/80 px-5 py-3">
                  <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
                    <span>12:00 → 13:00</span>
                    <span>1h 00m</span>
                    <span className="text-foreground/70">{t("card.meeting")}</span>
                  </div>
                </div>
              </div>

              {/* Corner crosshair ticks — CAD-style precision detail */}
              <div
                aria-hidden="true"
                className="absolute -right-2 -top-2 h-3 w-3"
              >
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/30" />
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-foreground/30" />
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-2 -left-2 h-3 w-3"
              >
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/30" />
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-foreground/30" />
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-6">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{tc("appName")}</span>
            <span>{t("footerYear")}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

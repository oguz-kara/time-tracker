import Link from "next/link";
import { Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export async function LandingHeader() {
  const session = await auth();
  const tc = await getTranslations("common");
  const tl = await getTranslations("landing");

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="DenTracker home"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Zap className="h-4 w-4 fill-current" strokeWidth={0} />
          </span>
          <span className="text-[15px] font-medium tracking-tight">
            {tc("appName")}
          </span>
          <span className="ml-1 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:inline">
            v0.1
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          {session ? (
            <Link
              href="/track"
              className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {tl("openApp")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tc("signIn")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

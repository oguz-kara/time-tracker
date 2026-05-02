"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type NavKey = "dashboard" | "track" | "preferences";

interface NavItem {
  titleKey: NavKey;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNav: NavItem[] = [
  { titleKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { titleKey: "track", href: "/track", icon: Clock },
];

const secondaryNav: NavItem[] = [
  { titleKey: "preferences", href: "/settings/tracking", icon: SlidersHorizontal },
];

function NavLink({
  item,
  primary,
  label,
}: {
  item: NavItem;
  primary: boolean;
  label: string;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md transition-colors",
        primary
          ? cn(
              "px-3 py-2 text-sm",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
            )
          : cn(
              "px-3 py-1.5 text-[13px]",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )
      )}
    >
      <Icon
        className={cn(
          primary ? "h-4 w-4" : "h-3.5 w-3.5",
          !primary && !isActive && "opacity-70 group-hover:opacity-100"
        )}
      />
      {label}
    </Link>
  );
}

export function MainNav() {
  const t = useTranslations("nav");

  return (
    <nav>
      <ul className="space-y-1">
        {primaryNav.map((item) => (
          <li key={item.href}>
            <NavLink item={item} primary label={t(item.titleKey)} />
          </li>
        ))}
      </ul>

      <div className="mt-6 mb-2 flex items-center gap-2 px-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
          {t("settingsSection")}
        </span>
        <span className="h-px flex-1 bg-border/60" />
      </div>

      <ul className="space-y-0.5">
        {secondaryNav.map((item) => (
          <li key={item.href}>
            <NavLink item={item} primary={false} label={t(item.titleKey)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const items = [
  { key: "today", href: "/habits" },
  { key: "backlog", href: "/habits/backlog" },
  { key: "sprint", href: "/habits/sprint" },
] as const;

export function HabitsNav() {
  const t = useTranslations("habits.nav");
  const pathname = usePathname();
  return (
    <div className="flex gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] transition-colors",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </div>
  );
}

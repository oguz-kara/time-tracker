"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MainNav } from "./main-nav";
import { UserNav } from "./user-nav";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export function Sidebar() {
  return (
    <div className="flex h-full flex-col border-r border-border bg-muted/40">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/track" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-4 w-4 fill-current" strokeWidth={0} />
          </div>
          <span className="text-lg font-medium tracking-tight">DenTracker</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <MainNav />
      </ScrollArea>

      <Separator />

      {/* User Nav */}
      <div className="flex items-center justify-between gap-2 p-4">
        <UserNav />
        <LanguageSwitcher variant="compact" />
      </div>
    </div>
  );
}

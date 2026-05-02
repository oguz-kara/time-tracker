"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MainNav } from "./main-nav";
import { UserNav } from "./user-nav";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle
              render={
                <Link
                  href="/track"
                  className="flex items-center gap-2"
                  onClick={() => setOpen(false)}
                />
              }
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Zap className="h-4 w-4 fill-current" strokeWidth={0} />
              </div>
              <span className="text-lg font-medium tracking-tight">DenTracker</span>
            </SheetTitle>
          </SheetHeader>

          {/* Main Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <MainNav />
          </ScrollArea>

          <Separator />

          {/* User Nav */}
          <div className="flex items-center justify-between p-4">
            <UserNav />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

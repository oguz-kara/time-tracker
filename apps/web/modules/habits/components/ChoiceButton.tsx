"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Option button for mutually-exclusive choices (habit type, frequency,
 * sprint length, retro outcome). Always renders the `outline` frame so
 * selecting never changes the button's size — selection only swaps colors
 * to the accent, per the design system's "accent = active state" rule.
 */
export function ChoiceButton({
  selected,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { selected: boolean }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      aria-pressed={selected}
      className={cn(
        selected &&
          "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:bg-primary dark:hover:bg-primary/90",
        className
      )}
      {...props}
    />
  );
}

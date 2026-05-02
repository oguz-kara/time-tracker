"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface BillingToggleProps {
  value: "monthly" | "yearly";
  onChange: (value: "monthly" | "yearly") => void;
  className?: string;
}

/**
 * Billing Period Toggle
 *
 * Lets users switch between monthly and yearly billing.
 * Shows savings badge for yearly option.
 */
export function BillingToggle({ value, onChange, className }: BillingToggleProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <button
        onClick={() => onChange("monthly")}
        className={cn(
          "px-4 py-2 rounded-lg font-medium transition-colors",
          value === "monthly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange("yearly")}
        className={cn(
          "px-4 py-2 rounded-lg font-medium transition-colors relative",
          value === "yearly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Yearly
        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
          Save 17%
        </span>
      </button>
    </div>
  );
}

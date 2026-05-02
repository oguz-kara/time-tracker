"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: readonly string[];
  billingPeriod: "monthly" | "yearly";
  isPopular?: boolean;
  isCurrent?: boolean;
  isDowngrade?: boolean;
  isLoading?: boolean;
  onSubscribe?: () => void;
  ctaText?: string;
  ctaDisabled?: boolean;
}

/**
 * Plan Card Component
 *
 * Displays a subscription plan with:
 * - Name and description
 * - Pricing (respects monthly/yearly toggle)
 * - Feature list
 * - CTA button
 * - Optional "Popular" and "Current Plan" badges
 */
export function PlanCard({
  id,
  name,
  description,
  priceMonthly,
  priceYearly,
  features,
  billingPeriod,
  isPopular = false,
  isCurrent = false,
  isDowngrade = false,
  isLoading = false,
  onSubscribe,
  ctaText,
  ctaDisabled = false,
}: PlanCardProps) {
  // Calculate price based on billing period
  const price = billingPeriod === "yearly" ? priceYearly : priceMonthly;
  const monthlyPrice = billingPeriod === "yearly" ? Math.round(priceYearly / 12) : priceMonthly;

  // Determine CTA text
  let buttonText = ctaText || (id === "free" ? "Get Started" : "Subscribe");
  if (isCurrent) {
    buttonText = "Current Plan";
  } else if (isDowngrade) {
    buttonText = "Downgrade Not Allowed";
  }

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPopular && "border-primary shadow-lg scale-105",
        isCurrent && "border-green-500"
      )}
    >
      {/* Badges */}
      {(isPopular || isCurrent) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
          {isPopular && (
            <Badge className="bg-primary text-primary-foreground">
              Most Popular
            </Badge>
          )}
          {isCurrent && (
            <Badge className="bg-green-500 text-white">
              Current Plan
            </Badge>
          )}
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              ${price === 0 ? "0" : monthlyPrice}
            </span>
            {price > 0 && <span className="text-muted-foreground">/month</span>}
          </div>
          {billingPeriod === "yearly" && price > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Billed ${priceYearly} annually
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={onSubscribe}
          disabled={ctaDisabled || isCurrent || isDowngrade || isLoading}
          variant={isPopular ? "default" : "outline"}
          size="lg"
        >
          {isLoading ? "Processing..." : buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}

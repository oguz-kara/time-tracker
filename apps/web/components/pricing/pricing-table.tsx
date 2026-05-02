"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanCard } from "./plan-card";
import { BillingToggle } from "./billing-toggle";
import { saasConfig } from "@/saas.config";
import { useCreateCheckoutMutation } from "@/lib/graphql/generated";

interface PricingTableProps {
  currentPlanId?: string;
  isLoggedIn?: boolean;
}

/**
 * Pricing Table Component
 *
 * Displays all subscription plans with:
 * - Monthly/yearly toggle
 * - Plan comparison cards
 * - Subscribe functionality
 * - Current plan indication
 */
export function PricingTable({ currentPlanId = "free", isLoggedIn = false }: PricingTableProps) {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const createCheckoutMutation = useCreateCheckoutMutation();

  const plans = Object.values(saasConfig.billing.plans);

  // Get current plan tier for downgrade detection
  const currentPlan = saasConfig.billing.plans[currentPlanId as keyof typeof saasConfig.billing.plans];
  const currentTier = currentPlan?.tier ?? 0;

  const handleSubscribe = async (planId: string) => {
    // For free plan or if not logged in, redirect to login
    if (planId === "free" || !isLoggedIn) {
      router.push("/login");
      return;
    }

    // Check if this is a downgrade (frontend validation - backend also checks)
    const plan = saasConfig.billing.plans[planId as keyof typeof saasConfig.billing.plans];
    const planTier = plan?.tier ?? 0;

    if (planTier < currentTier) {
      // This shouldn't happen if UI is disabled, but defensive check
      console.error("Downgrade not allowed");
      // TODO: Show error toast
      return;
    }

    // For paid plans, create checkout session
    try {
      const result = await createCheckoutMutation.mutateAsync({
        planId,
        interval: billingPeriod, // Pass selected billing period
      });

      // Redirect to Stripe checkout
      if (result.createCheckout?.url) {
        window.location.href = result.createCheckout.url;
      }
    } catch (error) {
      console.error("Failed to create checkout:", error);
      // TODO: Show error toast
    }
  };

  return (
    <div className="w-full">
      {/* Billing Period Toggle */}
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-3xl font-bold text-center mb-3">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground text-center mb-6 max-w-2xl">
          Start free and upgrade anytime. All plans include our core features.
        </p>
        <BillingToggle
          value={billingPeriod}
          onChange={setBillingPeriod}
        />
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const planTier = plan.tier ?? 0;
          const isDowngrade = isLoggedIn && planTier < currentTier;

          return (
            <PlanCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              description={plan.description}
              priceMonthly={plan.priceMonthly}
              priceYearly={plan.priceYearly}
              features={plan.features}
              billingPeriod={billingPeriod}
              isPopular={plan.id === "pro"}
              isCurrent={plan.id === currentPlanId}
              isDowngrade={isDowngrade}
              isLoading={createCheckoutMutation.isPending}
              onSubscribe={() => handleSubscribe(plan.id)}
              ctaText={plan.id === "free" ? "Get Started" : undefined}
            />
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
        <p>
          All plans include access to our core features. Upgrade anytime.
          To downgrade, cancel your current subscription and subscribe to a lower tier after it expires.
        </p>
      </div>
    </div>
  );
}

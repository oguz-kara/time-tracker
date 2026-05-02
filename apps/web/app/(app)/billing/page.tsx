"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetCreditBalanceQuery,
  useGetBillingPlansQuery,
  useGetCreditPacksQuery,
  useGetCreditHistoryQuery,
  useCreateCustomerPortalMutation,
  useCreateCreditCheckoutMutation,
} from "@/lib/graphql/generated";
import { CreditCard, ExternalLink, Zap, Check, TrendingUp, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function BillingPage() {
  // Disable caching for credits - always fetch fresh data (financial data should be accurate)
  const { data: balanceData, isLoading: balanceLoading } = useGetCreditBalanceQuery(undefined, {
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
  });
  const { data: plansData } = useGetBillingPlansQuery();
  const { data: packsData } = useGetCreditPacksQuery();
  const { data: historyData } = useGetCreditHistoryQuery({ limit: 10 }, {
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
  });

  const createPortalMutation = useCreateCustomerPortalMutation();
  const createCreditCheckoutMutation = useCreateCreditCheckoutMutation();

  const currentPlan = plansData?.billingPlans?.find(
    (p) => p.id === balanceData?.creditBalance?.planId
  );

  const handleManageSubscription = async () => {
    try {
      const result = await createPortalMutation.mutateAsync({});
      if (result?.createCustomerPortal?.url) {
        window.location.href = result.createCustomerPortal.url;
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    }
  };

  const handleBuyCredits = async (packId: string) => {
    try {
      const result = await createCreditCheckoutMutation.mutateAsync({ packId });
      if (result?.createCreditCheckout?.url) {
        window.location.href = result.createCreditCheckout.url;
      }
    } catch (error) {
      console.error("Failed to create checkout:", error);
    }
  };

  if (balanceLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const balance = balanceData?.creditBalance?.balance ?? 0;
  const subscriptionStatus = balanceData?.creditBalance?.subscriptionStatus;
  const cancelAtPeriodEnd = balanceData?.creditBalance?.cancelAtPeriodEnd;
  const subscriptionEndDate = balanceData?.creditBalance?.subscriptionEndDate;
  const currentPeriodEnd = balanceData?.creditBalance?.currentPeriodEnd;

  // Determine cancellation end date
  const cancellationEndDate = subscriptionEndDate || currentPeriodEnd;

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, credits, and billing information
        </p>
      </div>

      {/* Cancellation Alert */}
      {cancelAtPeriodEnd && cancellationEndDate && (
        <Card className="p-6 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-orange-600 dark:text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                Subscription Canceled
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                Your subscription has been canceled. You'll retain access to your current plan ({currentPlan?.name || "Pro"})
                until <strong>{format(new Date(cancellationEndDate), "MMMM dd, yyyy")}</strong>.
                After this date, your account will be downgraded to the Free plan.
              </p>
              <div className="flex gap-3">
                <Link href="/pricing">
                  <Button size="sm" variant="default">
                    Reactivate Subscription
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Current Plan & Credits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Balance Card */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Credit Balance</p>
              <p className="text-4xl font-bold">{balance.toLocaleString()}</p>
            </div>
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Credits are used for AI operations and premium features
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById("credit-packs")?.scrollIntoView({ behavior: "smooth" })}
          >
            Buy More Credits
          </Button>
        </Card>

        {/* Current Plan Card */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
              <p className="text-3xl font-bold">{currentPlan?.name || "Free"}</p>
            </div>
            <CreditCard className="h-10 w-10 text-primary" />
          </div>
          {subscriptionStatus && (
            <Badge className="mb-3" variant={subscriptionStatus === "active" ? "default" : "secondary"}>
              {subscriptionStatus}
            </Badge>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            {currentPlan?.description || "Get started with basic features"}
          </p>
          {currentPlan?.id === "free" ? (
            <Link href="/pricing" className="w-full">
              <Button variant="default" className="w-full gap-2">
                Upgrade Plan <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleManageSubscription}
              disabled={createPortalMutation.isPending}
            >
              {createPortalMutation.isPending ? "Loading..." : (
                <>
                  Manage Subscription <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </Card>
      </div>

      {/* Plan Features (if on a paid plan) */}
      {currentPlan && currentPlan.id !== "free" && currentPlan.features && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Plan Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentPlan.features?.map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Credit Packs */}
      <div id="credit-packs">
        <h2 className="text-2xl font-bold mb-4">Buy Credit Packs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packsData?.creditPacks?.map((pack) => (
            <Card key={pack.id} className="p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-2">{pack.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">{pack.credits?.toLocaleString() ?? 0}</span>
                <span className="text-muted-foreground"> credits</span>
              </div>
              <div className="mb-6">
                <span className="text-2xl font-bold">${pack.price ?? 0}</span>
                <span className="text-sm text-muted-foreground ml-1">
                  (${pack.credits && pack.price ? (pack.price / pack.credits).toFixed(3) : '0.000'}/credit)
                </span>
              </div>
              <Button
                className="w-full mt-auto"
                onClick={() => pack.id && handleBuyCredits(pack.id)}
                disabled={createCreditCheckoutMutation.isPending || !pack.id}
              >
                {createCreditCheckoutMutation.isPending ? "Processing..." : "Purchase"}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit History */}
      {historyData && historyData.creditHistory && historyData.creditHistory.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Credit History</h2>
          <Card>
            <div className="divide-y">
              {historyData.creditHistory.map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <TrendingUp className={`h-5 w-5 mt-0.5 ${(transaction.amount ?? 0) > 0 ? 'text-green-500' : 'text-orange-500'}`} />
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.createdAt ? format(new Date(transaction.createdAt), "MMM dd, yyyy 'at' h:mm a") : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${(transaction.amount ?? 0) > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {(transaction.amount ?? 0) > 0 ? '+' : ''}{(transaction.amount ?? 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Balance: {(transaction.balanceAfter ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Upgrade CTA (if on free plan) */}
      {currentPlan?.id === "free" && (
        <Card className="p-8 bg-primary/5 border-primary/20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Ready to unlock more?</h2>
            <p className="text-muted-foreground mb-6">
              Upgrade to Pro for unlimited projects, more storage, and 1000 AI credits per month
            </p>
            <Link href="/pricing">
              <Button size="lg">
                View Plans
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

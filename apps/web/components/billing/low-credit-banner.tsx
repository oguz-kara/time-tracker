"use client";

import { useGetCreditBalanceQuery } from "@/lib/graphql/generated";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const LOW_CREDIT_THRESHOLD = 100;
const CRITICAL_CREDIT_THRESHOLD = 50;

export function LowCreditBanner() {
  // Disable caching for credits - always fetch fresh data
  const { data } = useGetCreditBalanceQuery(undefined, {
    gcTime: 0,           // Don't cache in memory
    staleTime: 0,        // Always consider stale (refetch on mount)
    refetchOnMount: true, // Always refetch when component mounts
  });
  const [dismissed, setDismissed] = useState(false);

  if (!data?.creditBalance || dismissed) {
    return null;
  }

  const balance = data.creditBalance.balance ?? 0;

  // Don't show if credits are above threshold
  if (balance >= LOW_CREDIT_THRESHOLD) {
    return null;
  }

  const isCritical = balance < CRITICAL_CREDIT_THRESHOLD;

  return (
    <Alert
      className={`relative ${isCritical ? 'border-destructive bg-destructive/10' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}
    >
      <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-500'}`} />
      <AlertDescription className="flex items-center justify-between gap-4 pr-8">
        <span className="text-sm">
          {isCritical ? (
            <strong>Critical: </strong>
          ) : (
            <strong>Warning: </strong>
          )}
          You have {balance} credits remaining.
          {isCritical ? ' Your account is running low on credits.' : ' Consider purchasing more to continue using AI features.'}
        </span>
        <Link href="/billing">
          <Button
            size="sm"
            variant={isCritical ? "destructive" : "default"}
          >
            Buy Credits
          </Button>
        </Link>
      </AlertDescription>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2.5 rounded-md p-1 hover:bg-secondary transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}

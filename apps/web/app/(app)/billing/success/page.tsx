"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CreditCard, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Billing Success Page
 *
 * Shown after successful Stripe checkout for:
 * - Subscription purchases (default)
 * - Credit pack purchases (?type=credits)
 *
 * Displays success message and redirects to dashboard or billing page.
 */
export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [countdown, setCountdown] = useState(5);

  const isCredits = type === "credits";

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate effect for redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push("/dashboard");
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            {isCredits ? (
              <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            )}
          </div>

          {/* Title */}
          <CardTitle className="text-2xl">
            {isCredits ? "Credits Added!" : "Subscription Active!"}
          </CardTitle>

          {/* Description */}
          <CardDescription className="text-base mt-2">
            {isCredits
              ? "Your credits have been added to your account and are ready to use."
              : "Your subscription has been activated successfully. Thank you for your purchase!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Success Details */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">Payment processed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {isCredits ? "Credits added to balance" : "Subscription activated"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">Receipt sent to your email</span>
            </div>
          </div>

          {/* Auto-redirect notice */}
          <p className="text-center text-sm text-muted-foreground">
            Redirecting to dashboard in {countdown} second{countdown !== 1 ? "s" : ""}...
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {/* Primary Actions */}
          <div className="flex w-full gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Secondary Action */}
          <Link href="/billing" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              <CreditCard className="h-4 w-4" />
              View Billing Details
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Stripe Webhook Endpoint
 *
 * Receives and processes Stripe webhooks for:
 * - Checkout completions
 * - Subscription lifecycle events
 * - Payment events
 *
 * Security:
 * - Verifies webhook signature
 * - Queues processing through Inngest for reliability
 */

import { NextRequest, NextResponse } from "next/server";
import { createBillingProvider } from "@/modules/billing/factory";
import { inngest } from "@/lib/inngest";
import * as billingService from "@/modules/billing/service";
import { saasConfig } from "@/saas.config";

export async function POST(req: NextRequest) {
  try {
    // Get raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify and parse webhook using billing provider
    const billing = createBillingProvider();
    const event = await billing.handleWebhook(body, signature);

    // Skip sending ignored events to Inngest
    if (event.type === "ignored") {
      return NextResponse.json({ received: true, ignored: true });
    }

    console.log(`[Webhook] Processing ${event.type}`);

    // In development, process synchronously (no Inngest dev server needed)
    // In production, use Inngest for reliability
    if (process.env.NODE_ENV === "development") {
      await processWebhookSync(event);
      console.log(`[Webhook] ${event.type} processed synchronously (dev mode)`);
    } else {
      // Send to Inngest for reliable processing
      await inngest.send({
        name: "billing/webhook",
        data: event,
      });
      console.log(`[Webhook] ${event.type} queued for Inngest processing`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Process webhook synchronously (for development mode)
 * This replicates the Inngest function logic
 */
async function processWebhookSync(billingEvent: any) {
  switch (billingEvent.type) {
    case "checkout.completed": {
      // Handle credit purchase
      if (billingEvent.data.credits) {
        await billingService.addCredits(
          billingEvent.data.orgId,
          billingEvent.data.credits!,
          "purchase",
          "Credit pack purchase"
        );
        console.log(`[Webhook] Added ${billingEvent.data.credits} credits via purchase`);
      }

      // Handle subscription activation (logged only, subscription.created handles the actual work)
      if (billingEvent.data.planId) {
        console.log(`[Webhook] Checkout completed for plan: ${billingEvent.data.planId}`);
      }

      break;
    }

    case "subscription.created":
    case "subscription.updated": {
      console.log(`[Webhook] Processing ${billingEvent.type} for org ${billingEvent.data.orgId}, plan ${billingEvent.data.planId}`);

      // Check for duplicate subscriptions and auto-cancel old ones
      if (billingEvent.type === "subscription.created") {
        const existingBilling = await billingService.getBillingRecord(billingEvent.data.orgId);

        // If there's a DIFFERENT subscription stored in database, cancel it in Stripe
        // (regardless of database status - database might be wrong if cancellation failed)
        if (
          existingBilling?.subscriptionId &&
          existingBilling.subscriptionId !== billingEvent.data.subscriptionId
        ) {
          console.warn(
            `[Webhook] Different subscription detected for org ${billingEvent.data.orgId}:\n` +
            `  Old: ${existingBilling.subscriptionId} (${existingBilling.planId}, DB status: ${existingBilling.subscriptionStatus})\n` +
            `  New: ${billingEvent.data.subscriptionId} (${billingEvent.data.planId})\n` +
            `  Ensuring old subscription is canceled in Stripe...`
          );

          // Always try to cancel old subscription in Stripe (even if DB says it's canceled)
          // This handles cases where Stripe cancellation failed but DB was updated
          const billing = createBillingProvider();
          const cancelResult = await billing.cancelSubscription(existingBilling.subscriptionId);

          if (cancelResult.success) {
            console.log(`[Webhook] Successfully canceled old subscription ${existingBilling.subscriptionId} in Stripe`);
          } else {
            console.error(
              `[Webhook] Failed to cancel old subscription ${existingBilling.subscriptionId} in Stripe. ` +
              `It may already be canceled or invalid.`
            );
          }
        }
      }

      // Check if subscription was canceled (via Stripe portal)
      if (billingEvent.type === "subscription.updated" && billingEvent.data.cancelAtPeriodEnd) {
        console.log(
          `[Webhook] Subscription ${billingEvent.data.subscriptionId} canceled - ` +
          `access until ${billingEvent.data.currentPeriodEnd.toISOString()}`
        );
        await billingService.cancelSubscription(
          billingEvent.data.orgId,
          billingEvent.data.canceledAt,
          billingEvent.data.currentPeriodEnd
        );
      } else {
        // Update subscription record (normal update or reactivation)
        await billingService.updateSubscription({
          orgId: billingEvent.data.orgId,
          planId: billingEvent.data.planId,
          subscriptionId: billingEvent.data.subscriptionId,
          currentPeriodStart: billingEvent.data.currentPeriodStart,
          currentPeriodEnd: billingEvent.data.currentPeriodEnd,
        });
      }
      console.log(`[Webhook] Subscription updated for org ${billingEvent.data.orgId}`);

      // Grant monthly credits for hybrid plans (only on creation or renewal, not on cancellation)
      if (billingEvent.type === "subscription.created" || !billingEvent.data.cancelAtPeriodEnd) {
        const plan =
          saasConfig.billing.plans[
            billingEvent.data.planId as keyof typeof saasConfig.billing.plans
          ];

        console.log(`[Webhook] Plan lookup for ${billingEvent.data.planId}:`, {
          found: !!plan,
          hasCreditsPerMonth: plan && "creditsPerMonth" in plan,
          creditsAmount: plan && "creditsPerMonth" in plan ? plan.creditsPerMonth : 0,
        });

        if (plan && "creditsPerMonth" in plan && plan.creditsPerMonth) {
          console.log(`[Webhook] Granting ${plan.creditsPerMonth} credits to org ${billingEvent.data.orgId}`);
          const result = await billingService.addCredits(
            billingEvent.data.orgId,
            plan.creditsPerMonth,
            "subscription_grant",
            `Monthly ${billingEvent.data.planId} plan credits`
          );
          console.log(`[Webhook] Credits granted successfully. New balance:`, result);
        } else {
          console.log(`[Webhook] No credits to grant for plan ${billingEvent.data.planId}`);
        }
      }

      break;
    }

    case "subscription.deleted": {
      console.log(
        `[Webhook] Subscription ${billingEvent.data.subscriptionId} expired for org ${billingEvent.data.orgId} - downgrading to Free plan`
      );
      await billingService.expireSubscription(billingEvent.data.orgId);
      break;
    }

    case "payment.succeeded": {
      console.log(
        `[Webhook] Payment succeeded for org ${billingEvent.data.orgId}: $${billingEvent.data.amount / 100}`
      );
      break;
    }

    case "payment.failed": {
      console.error(
        `[Webhook] Payment failed for org ${billingEvent.data.orgId}: ${billingEvent.data.reason}`
      );
      break;
    }
  }
}

/**
 * Inngest Billing Webhook Handler
 *
 * Processes Stripe webhooks reliably with:
 * - Automatic retries on failure
 * - Idempotent operations (safe to run multiple times)
 * - Step-by-step execution tracking
 */

import { inngest } from "@/lib/inngest";
import * as billingService from "@/modules/billing/service";
import { saasConfig } from "@/saas.config";

export const handleBillingWebhook = inngest.createFunction(
  {
    id: "handle-billing-webhook",
    retries: 3,
  },
  { event: "billing/webhook" },
  async ({ event, step }) => {
    const billingEvent = event.data;

    switch (billingEvent.type) {
      case "checkout.completed": {
        // Handle credit purchase
        if (billingEvent.data.credits) {
          await step.run("add-credits", async () => {
            return await billingService.addCredits(
              billingEvent.data.orgId,
              billingEvent.data.credits!,
              "purchase",
              "Credit pack purchase"
            );
          });
        }

        // Handle subscription activation
        if (billingEvent.data.planId) {
          await step.run("activate-subscription", async () => {
            // Note: For checkout.completed, we don't have subscription details yet
            // Those come from subscription.created event
            console.log(`Checkout completed for plan: ${billingEvent.data.planId}`);
          });
        }

        break;
      }

      case "subscription.created":
      case "subscription.updated": {
        console.log(`[Inngest] Processing ${billingEvent.type} for org ${billingEvent.data.orgId}, plan ${billingEvent.data.planId}`);

        await step.run("update-subscription", async () => {
          const result = await billingService.updateSubscription({
            orgId: billingEvent.data.orgId,
            planId: billingEvent.data.planId,
            subscriptionId: billingEvent.data.subscriptionId,
            currentPeriodStart: billingEvent.data.currentPeriodStart,
            currentPeriodEnd: billingEvent.data.currentPeriodEnd,
          });
          console.log(`[Inngest] Subscription updated for org ${billingEvent.data.orgId}`);
          return result;
        });

        // Grant monthly credits for hybrid plans
        const plan =
          saasConfig.billing.plans[
            billingEvent.data.planId as keyof typeof saasConfig.billing.plans
          ];

        console.log(`[Inngest] Plan lookup for ${billingEvent.data.planId}:`, {
          found: !!plan,
          hasCreditsPerMonth: plan && "creditsPerMonth" in plan,
          creditsAmount: plan && "creditsPerMonth" in plan ? plan.creditsPerMonth : 0,
        });

        if (plan && "creditsPerMonth" in plan && plan.creditsPerMonth) {
          await step.run("grant-monthly-credits", async () => {
            console.log(`[Inngest] Granting ${plan.creditsPerMonth} credits to org ${billingEvent.data.orgId}`);
            const result = await billingService.addCredits(
              billingEvent.data.orgId,
              plan.creditsPerMonth,
              "subscription_grant",
              `Monthly ${billingEvent.data.planId} plan credits`
            );
            console.log(`[Inngest] Credits granted successfully. New balance:`, result);
            return result;
          });
        } else {
          console.log(`[Inngest] No credits to grant for plan ${billingEvent.data.planId}`);
        }

        break;
      }

      case "subscription.canceled": {
        await step.run("cancel-subscription", async () => {
          return await billingService.cancelSubscription(
            billingEvent.data.orgId
          );
        });
        break;
      }

      case "payment.succeeded": {
        await step.run("log-payment-success", async () => {
          console.log(
            `Payment succeeded for org ${billingEvent.data.orgId}: $${billingEvent.data.amount / 100}`
          );
        });
        break;
      }

      case "payment.failed": {
        await step.run("log-payment-failure", async () => {
          console.error(
            `Payment failed for org ${billingEvent.data.orgId}: ${billingEvent.data.reason}`
          );
        });
        break;
      }
    }

    // TODO: Send receipt email
    // await step.run('send-receipt', () => sendReceiptEmail(billingEvent));

    return { success: true, event: billingEvent.type };
  }
);

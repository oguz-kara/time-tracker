/**
 * Stripe Billing Adapter
 *
 * Implements the BillingProvider interface using Stripe's API.
 * Handles checkout sessions, customer portal, webhooks, and customer management.
 */

import Stripe from "stripe";
import type { BillingProvider, BillingEvent } from "../interface";
import { saasConfig } from "@/saas.config";

export class StripeAdapter implements BillingProvider {
  private client: Stripe;

  constructor(secretKey: string) {
    this.client = new Stripe(secretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }

  async createCheckoutSession(params: {
    planId: string;
    customerId?: string;
    organizationId: string;
    successUrl: string;
    cancelUrl: string;
    mode: "subscription" | "payment";
    interval?: "monthly" | "yearly";
  }): Promise<{ url: string; sessionId: string }> {
    const { planId, organizationId, successUrl, cancelUrl, mode, customerId, interval = "monthly" } =
      params;

    // Get plan configuration
    const plan =
      saasConfig.billing.plans[planId as keyof typeof saasConfig.billing.plans];

    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    // Use Stripe price ID if available, otherwise create inline price
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (mode === "subscription" && "stripePriceIdMonthly" in plan) {
      // Use Stripe Price ID based on interval
      const priceId = interval === "yearly" && plan.stripePriceIdYearly
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

      if (priceId) {
        lineItems.push({
          price: priceId,
          quantity: 1,
        });
      } else {
        // Fallback: create inline price (useful for development)
        const amount = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
        const recurringInterval = interval === "yearly" ? "year" : "month";

        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.description,
            },
            unit_amount: amount * 100, // Convert to cents
            recurring: { interval: recurringInterval },
          },
          quantity: 1,
        });
      }
    } else {
      // One-time payment mode
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${plan.name} Plan`,
            description: plan.description,
          },
          unit_amount: plan.priceMonthly * 100, // Convert to cents
        },
        quantity: 1,
      });
    }

    const session = await this.client.checkout.sessions.create({
      mode: mode === "subscription" ? "subscription" : "payment",
      customer: customerId,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        planId,
      },
      // Pass metadata to subscription (critical for webhook processing)
      ...(mode === "subscription" && {
        subscription_data: {
          metadata: {
            organizationId,
            planId,
          },
        },
      }),
      // Enable customer creation if not provided
      ...((!customerId && {
        customer_creation: "always",
      }) as any),
    });

    if (!session.url) {
      throw new Error("Stripe checkout session created but no URL returned");
    }

    return { url: session.url, sessionId: session.id };
  }

  async createCustomerPortal(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const { customerId, returnUrl } = params;

    const session = await this.client.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async createCreditPurchase(params: {
    packId: string;
    customerId: string;
    organizationId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    const { packId, customerId, organizationId, successUrl, cancelUrl } =
      params;

    // Find credit pack
    const pack = saasConfig.billing.creditPacks.find((p) => p.id === packId);

    if (!pack) {
      throw new Error(`Credit pack not found: ${packId}`);
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if ("stripePriceId" in pack && pack.stripePriceId) {
      lineItems.push({
        price: pack.stripePriceId,
        quantity: 1,
      });
    } else {
      // Fallback: inline price for development
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: pack.name,
            description: `${pack.credits} AI Credits`,
          },
          unit_amount: pack.price * 100, // Convert to cents
        },
        quantity: 1,
      });
    }

    const session = await this.client.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        packId,
        credits: pack.credits.toString(),
      },
    });

    if (!session.url) {
      throw new Error("Stripe checkout session created but no URL returned");
    }

    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<BillingEvent> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    // Verify webhook signature
    const event = this.client.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const credits = session.metadata?.credits
          ? parseInt(session.metadata.credits)
          : undefined;

        return {
          type: "checkout.completed",
          data: {
            customerId: session.customer as string,
            planId: session.metadata?.planId,
            credits,
            orgId: session.metadata!.organizationId,
          },
        };
      }

      case "customer.subscription.created": {
        const sub = event.data.object as any; // Stripe types use snake_case

        console.log('[Stripe] subscription.created received:', {
          subscriptionId: sub.id,
          customer: sub.customer,
          metadata: sub.metadata,
          hasOrgId: !!sub.metadata?.organizationId,
          hasPlanId: !!sub.metadata?.planId,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          periodStartType: typeof sub.current_period_start,
          periodEndType: typeof sub.current_period_end,
        });

        // Validate required metadata
        if (!sub.metadata?.organizationId) {
          console.error('[Stripe] Subscription missing organizationId:', sub);
          throw new Error(
            `Subscription ${sub.id} missing organizationId in metadata. ` +
            `This should be set via subscription_data.metadata in checkout session. ` +
            `Metadata received: ${JSON.stringify(sub.metadata)}`
          );
        }
        if (!sub.metadata?.planId) {
          console.error('[Stripe] Subscription missing planId:', sub);
          throw new Error(
            `Subscription ${sub.id} missing planId in metadata. ` +
            `This should be set via subscription_data.metadata in checkout session. ` +
            `Metadata received: ${JSON.stringify(sub.metadata)}`
          );
        }

        console.log('[Stripe] subscription.created validated successfully');

        // Parse dates - Stripe sends Unix timestamps (seconds since epoch)
        const periodStart = sub.current_period_start
          ? new Date(sub.current_period_start * 1000)
          : new Date();

        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days from now

        console.log('[Stripe] Parsed dates:', {
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          isValidStart: !isNaN(periodStart.getTime()),
          isValidEnd: !isNaN(periodEnd.getTime()),
        });

        return {
          type: "subscription.created",
          data: {
            customerId: sub.customer as string,
            planId: sub.metadata.planId,
            orgId: sub.metadata.organizationId,
            subscriptionId: sub.id,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        };
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any; // Stripe types use snake_case

        // Validate required metadata
        if (!sub.metadata?.organizationId) {
          throw new Error(
            `Subscription ${sub.id} missing organizationId in metadata. ` +
            `This should be set via subscription_data.metadata in checkout session.`
          );
        }
        if (!sub.metadata?.planId) {
          throw new Error(
            `Subscription ${sub.id} missing planId in metadata. ` +
            `This should be set via subscription_data.metadata in checkout session.`
          );
        }

        // Parse dates - Stripe sends Unix timestamps (seconds since epoch)
        const periodStart = sub.current_period_start
          ? new Date(sub.current_period_start * 1000)
          : new Date();

        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Parse cancellation metadata
        const cancelAtPeriodEnd = sub.cancel_at_period_end || false;
        const canceledAt = sub.canceled_at
          ? new Date(sub.canceled_at * 1000)
          : undefined;

        console.log('[Stripe] subscription.updated:', {
          subscriptionId: sub.id,
          cancelAtPeriodEnd,
          canceledAt: canceledAt?.toISOString(),
        });

        return {
          type: "subscription.updated",
          data: {
            customerId: sub.customer as string,
            planId: sub.metadata.planId,
            orgId: sub.metadata.organizationId,
            subscriptionId: sub.id,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd,
            canceledAt,
          },
        };
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any; // Stripe types use snake_case

        console.log('[Stripe] subscription.deleted received:', {
          subscriptionId: sub.id,
          customer: sub.customer,
          canceled_at: sub.canceled_at,
          ended_at: sub.ended_at,
        });

        // Validate required metadata
        if (!sub.metadata?.organizationId) {
          console.error('[Stripe] Subscription deleted event missing organizationId:', sub);
          throw new Error(
            `Subscription ${sub.id} missing organizationId in metadata.`
          );
        }

        return {
          type: "subscription.deleted",
          data: {
            customerId: sub.customer as string,
            orgId: sub.metadata.organizationId,
            subscriptionId: sub.id,
          },
        };
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return {
          type: "payment.succeeded",
          data: {
            amount: paymentIntent.amount,
            customerId: paymentIntent.customer as string,
            orgId: paymentIntent.metadata?.organizationId || "",
          },
        };
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return {
          type: "payment.failed",
          data: {
            customerId: paymentIntent.customer as string,
            orgId: paymentIntent.metadata?.organizationId || "",
            reason: paymentIntent.last_payment_error?.message || "Unknown error",
          },
        };
      }

      // Ignore these events - they're informational only
      case "payment_intent.created":
      case "charge.updated":
      case "charge.succeeded":
      case "payment_method.attached":
      case "customer.updated":
      case "invoice.created":
      case "invoice.finalized":
      case "invoice.paid":
      case "invoice.payment_succeeded":
      case "invoice_payment.paid": {
        // These events don't require processing in our system
        // We handle payments via checkout.session.completed and subscription events
        console.log(`[Stripe] Ignoring informational event: ${event.type}`);
        return {
          type: "ignored" as any,
          data: {} as any,
        };
      }

      default:
        throw new Error(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    orgId: string;
  }): Promise<{ customerId: string }> {
    const { email, name, orgId } = params;

    const customer = await this.client.customers.create({
      email,
      name,
      metadata: {
        organizationId: orgId,
      },
    });

    return { customerId: customer.id };
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean }> {
    try {
      await this.client.subscriptions.cancel(subscriptionId);
      console.log(`[Stripe] Canceled subscription: ${subscriptionId}`);
      return { success: true };
    } catch (error) {
      console.error(`[Stripe] Failed to cancel subscription ${subscriptionId}:`, error);
      return { success: false };
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Simple API call to verify credentials
      await this.client.balance.retrieve();
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Billing Service Layer
 *
 * Contains all business logic for billing operations:
 * - Credit management (add, deduct, balance, history)
 * - Entitlement checking
 * - Checkout and subscription management
 * - Customer management
 *
 * All credit operations use database transactions for atomicity.
 */

import { db, eq, desc } from "@jetframe/db";
import {
  organizationBilling,
  creditTransactions,
} from "@jetframe/db/schema/billing";
import { createBillingProvider } from "./factory";
import { NotEnoughCreditsError, NotFoundError } from "@/modules/shared/errors";
import { saasConfig } from "@/saas.config";
import type { TransactionType, EntitlementCheck } from "./types";

// === CREDIT OPERATIONS ===

/**
 * Add credits to an organization's balance
 * Used for: purchases, subscription grants, adjustments
 */
export async function addCredits(
  orgId: string,
  amount: number,
  type: TransactionType,
  description: string,
  metadata?: Record<string, any>
): Promise<{ newBalance: number }> {
  return await db.transaction(async (tx) => {
    // Get current billing record or create one
    let billing = await tx.query.organizationBilling.findFirst({
      where: eq(organizationBilling.organizationId, orgId),
    });

    if (!billing) {
      // Create billing record if it doesn't exist
      const [newBilling] = await tx
        .insert(organizationBilling)
        .values({
          organizationId: orgId,
          creditBalance: 0,
        })
        .returning();
      billing = newBilling;
    }

    const newBalance = billing.creditBalance + amount;

    // Update balance
    await tx
      .update(organizationBilling)
      .set({ creditBalance: newBalance, updatedAt: new Date() })
      .where(eq(organizationBilling.organizationId, orgId));

    // Record transaction
    await tx.insert(creditTransactions).values({
      organizationId: orgId,
      amount,
      type,
      description,
      metadata,
      balanceAfter: newBalance,
    });

    return { newBalance };
  });
}

/**
 * Deduct credits from an organization's balance
 * Used for: AI generation, usage-based features
 * Throws NotEnoughCreditsError if insufficient balance
 */
export async function deductCredits(
  orgId: string,
  amount: number,
  description: string,
  metadata?: Record<string, any>
): Promise<{ newBalance: number }> {
  return await db.transaction(async (tx) => {
    const billing = await tx.query.organizationBilling.findFirst({
      where: eq(organizationBilling.organizationId, orgId),
    });

    if (!billing || billing.creditBalance < amount) {
      throw new NotEnoughCreditsError(
        `Insufficient credits. Required: ${amount}, Available: ${billing?.creditBalance || 0}`
      );
    }

    const newBalance = billing.creditBalance - amount;

    await tx
      .update(organizationBilling)
      .set({ creditBalance: newBalance, updatedAt: new Date() })
      .where(eq(organizationBilling.organizationId, orgId));

    await tx.insert(creditTransactions).values({
      organizationId: orgId,
      amount: -amount, // Negative for deductions
      type: "usage",
      description,
      metadata,
      balanceAfter: newBalance,
    });

    return { newBalance };
  });
}

/**
 * Get current credit balance for an organization
 */
export async function getCreditBalance(orgId: string): Promise<number> {
  const billing = await db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.organizationId, orgId),
  });
  return billing?.creditBalance || 0;
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(orgId: string, limit = 50) {
  return db.query.creditTransactions.findMany({
    where: eq(creditTransactions.organizationId, orgId),
    orderBy: [desc(creditTransactions.createdAt)],
    limit,
  });
}

// === ENTITLEMENT CHECKS ===

/**
 * Check if organization is entitled to use a feature
 * Checks subscription status, credits, and plan limits
 */
export async function checkEntitlement(
  orgId: string,
  feature: string,
  requiredCredits?: number
): Promise<EntitlementCheck> {
  const billing = await db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.organizationId, orgId),
  });

  if (!billing) {
    return { allowed: false, reason: "No billing record found" };
  }

  // Check for grace period on canceled subscriptions
  const now = new Date();
  if (billing.cancelAtPeriodEnd || billing.subscriptionStatus === "canceled") {
    const endDate = billing.subscriptionEndDate || billing.currentPeriodEnd;

    if (endDate && now < endDate) {
      // Within grace period - allow access with current plan
      console.log(
        `[Entitlement] Org ${orgId} has canceled subscription but within grace period ` +
        `(expires ${endDate.toISOString()})`
      );
    } else {
      // Grace period expired - treat as free plan
      console.log(
        `[Entitlement] Org ${orgId} subscription expired, using Free plan limits`
      );
      // Will fall through to use planId (which should be "free" after expiration)
    }
  }

  // Check subscription status (past_due/unpaid blocks access immediately)
  if (
    billing.subscriptionStatus &&
    ["past_due", "unpaid"].includes(billing.subscriptionStatus)
  ) {
    return { allowed: false, reason: "Payment past due" };
  }

  // Check credits if required
  if (requiredCredits && billing.creditBalance < requiredCredits) {
    return {
      allowed: false,
      reason: `Insufficient credits. Required: ${requiredCredits}, Available: ${billing.creditBalance}`,
    };
  }

  // Get plan limits
  const planId = billing.planId || "free";
  const plan =
    saasConfig.billing.plans[planId as keyof typeof saasConfig.billing.plans];

  if (!plan) {
    return { allowed: false, reason: "Invalid plan" };
  }

  // Feature-specific limit checks can be added here
  // Example: if (feature === 'ai-generation' && !plan.features.includes('AI Credits')) { ... }

  return { allowed: true };
}

// === CHECKOUT OPERATIONS ===

/**
 * Create a checkout session for a subscription plan
 */
export async function createCheckout(
  orgId: string,
  planId: string,
  interval?: "monthly" | "yearly"
) {
  const billing = createBillingProvider();
  const billingRecord = await getOrCreateBillingRecord(orgId);

  // Check for existing active subscription to prevent duplicates
  const activeStatuses = ["active", "trialing", "past_due"];
  if (
    billingRecord.subscriptionId &&
    billingRecord.subscriptionStatus &&
    activeStatuses.includes(billingRecord.subscriptionStatus)
  ) {
    // If trying to subscribe to the SAME plan, reject
    if (billingRecord.planId === planId) {
      throw new Error(
        `You already have an active ${planId} subscription. ` +
        `Please cancel your current subscription before creating a new one.`
      );
    }

    // Check if this is a downgrade attempt and block it
    const currentPlan = saasConfig.billing.plans[billingRecord.planId as keyof typeof saasConfig.billing.plans];
    const requestedPlan = saasConfig.billing.plans[planId as keyof typeof saasConfig.billing.plans];

    if (currentPlan && requestedPlan) {
      const currentTier = currentPlan.tier ?? 0;
      const requestedTier = requestedPlan.tier ?? 0;

      if (requestedTier < currentTier) {
        throw new Error(
          `Cannot downgrade from ${currentPlan.name} to ${requestedPlan.name}. ` +
          `Please cancel your current subscription and wait for it to expire before subscribing to a lower tier plan.`
        );
      }
    }

    // If changing plans (upgrade), cancel the old subscription first
    console.log(
      `[Billing] Canceling existing ${billingRecord.planId} subscription (${billingRecord.subscriptionId}) before creating ${planId} subscription`
    );

    try {
      const cancelResult = await billing.cancelSubscription(billingRecord.subscriptionId);

      if (cancelResult.success) {
        // Update database to reflect cancellation
        await cancelSubscription(orgId);
        console.log(`[Billing] Successfully canceled old subscription ${billingRecord.subscriptionId} in Stripe`);
      } else {
        // Cancellation failed but continue - webhook will retry
        console.warn(
          `[Billing] Failed to cancel old subscription ${billingRecord.subscriptionId} in Stripe. ` +
          `Webhook will handle cleanup when new subscription is created.`
        );
        // Don't update database status since Stripe cancellation failed
      }
    } catch (error) {
      console.error(`[Billing] Error canceling old subscription:`, error);
      // Continue anyway - webhook will handle cleanup
    }
  }

  const { url, sessionId } = await billing.createCheckoutSession({
    planId,
    customerId: billingRecord.stripeCustomerId || undefined,
    organizationId: orgId,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    mode: "subscription",
    interval, // Pass interval to adapter
  });

  return { checkoutUrl: url, sessionId };
}

/**
 * Create a checkout session for a credit pack purchase
 */
export async function createCreditCheckout(orgId: string, packId: string) {
  const billing = createBillingProvider();
  const billingRecord = await getOrCreateBillingRecord(orgId);

  if (!billingRecord.stripeCustomerId) {
    throw new NotFoundError("Stripe customer");
  }

  const { url, sessionId } = await billing.createCreditPurchase({
    packId,
    customerId: billingRecord.stripeCustomerId,
    organizationId: orgId,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?type=credits`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return { checkoutUrl: url, sessionId };
}

/**
 * Create customer portal session for subscription management
 */
export async function createCustomerPortal(orgId: string) {
  const billing = createBillingProvider();
  const billingRecord = await db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.organizationId, orgId),
  });

  if (!billingRecord?.stripeCustomerId) {
    throw new NotFoundError("Stripe customer");
  }

  const { url } = await billing.createCustomerPortal({
    customerId: billingRecord.stripeCustomerId,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return { portalUrl: url };
}

// === SUBSCRIPTION MANAGEMENT (Called by webhooks) ===

/**
 * Activate a subscription for an organization
 */
export async function activateSubscription(
  orgId: string,
  planId: string,
  subscriptionId: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
) {
  await db
    .update(organizationBilling)
    .set({
      planId,
      subscriptionId,
      subscriptionStatus: "active",
      currentPeriodStart,
      currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, orgId));
}

/**
 * Update subscription information
 */
export async function updateSubscription(data: {
  orgId: string;
  planId: string;
  subscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}) {
  await db
    .update(organizationBilling)
    .set({
      planId: data.planId,
      subscriptionId: data.subscriptionId,
      subscriptionStatus: "active",
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, data.orgId));
}

/**
 * Cancel a subscription (scheduled for end of period)
 * Called when user cancels via Stripe portal or subscription.updated webhook
 */
export async function cancelSubscription(
  orgId: string,
  canceledAt?: Date,
  subscriptionEndDate?: Date
) {
  const updates: any = {
    cancelAtPeriodEnd: true,
    canceledAt: canceledAt || new Date(),
    updatedAt: new Date(),
  };

  // If we know when it ends, store it
  if (subscriptionEndDate) {
    updates.subscriptionEndDate = subscriptionEndDate;
  }

  await db
    .update(organizationBilling)
    .set(updates)
    .where(eq(organizationBilling.organizationId, orgId));
}

/**
 * Expire a subscription (actually end it)
 * Called when subscription.deleted webhook fires
 */
export async function expireSubscription(orgId: string) {
  await db
    .update(organizationBilling)
    .set({
      subscriptionStatus: "canceled",
      planId: "free", // Downgrade to free plan
      subscriptionId: null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, orgId));
}

// === CUSTOMER MANAGEMENT ===

/**
 * Get or create a billing record for an organization
 * Creates Stripe customer if needed
 */
export async function getOrCreateBillingRecord(orgId: string) {
  let billing = await db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.organizationId, orgId),
  });

  if (!billing) {
    // Create billing record
    const [newBilling] = await db
      .insert(organizationBilling)
      .values({
        organizationId: orgId,
        creditBalance: 0,
      })
      .returning();

    billing = newBilling;
  }

  // Create Stripe customer if not exists
  if (!billing.stripeCustomerId) {
    // Get organization details
    const org = await db.query.organizations.findFirst({
      where: (organizations, { eq }) => eq(organizations.id, orgId),
    });

    if (!org) {
      throw new NotFoundError("Organization");
    }

    const billingProvider = createBillingProvider();
    const { customerId } = await billingProvider.createCustomer({
      email: `billing+${org.slug}@jetframe.io`, // TODO: Get actual email from org owner
      name: org.name,
      orgId,
    });

    // Update billing record with customer ID
    await db
      .update(organizationBilling)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizationBilling.organizationId, orgId));

    billing.stripeCustomerId = customerId;
  }

  return billing;
}

/**
 * Get billing record for an organization
 */
export async function getBillingRecord(orgId: string) {
  return db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.organizationId, orgId),
  });
}

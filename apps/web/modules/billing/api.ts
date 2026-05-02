/**
 * Billing GraphQL API (Resolvers)
 *
 * Thin resolvers that delegate to the billing service layer.
 * Handles authentication and GraphQL-specific concerns only.
 */

import { builder } from "@/lib/graphql/builder";
import * as billingService from "./service";
import { saasConfig } from "@/saas.config";
import { NotAuthenticatedError } from "@/modules/shared/errors";
import {
  CreditBalanceType,
  CreditTransactionType,
  CheckoutResultType,
  CustomerPortalResultType,
  BillingPlanType,
  CreditPackType,
} from "./schema";

// === QUERIES ===

/**
 * Get credit balance for current organization
 */
builder.queryField("creditBalance", (t) =>
  t.field({
    type: CreditBalanceType,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      const balance = await billingService.getCreditBalance(
        ctx.session.activeOrganizationId
      );
      const billing = await billingService.getBillingRecord(
        ctx.session.activeOrganizationId
      );

      return {
        balance,
        planId: billing?.planId || "free",
        subscriptionStatus: billing?.subscriptionStatus || undefined,
        cancelAtPeriodEnd: billing?.cancelAtPeriodEnd || false,
        subscriptionEndDate: billing?.subscriptionEndDate || undefined,
        currentPeriodEnd: billing?.currentPeriodEnd || undefined,
      };
    },
  })
);

/**
 * Get credit transaction history
 */
builder.queryField("creditHistory", (t) =>
  t.field({
    type: [CreditTransactionType],
    args: {
      limit: t.arg.int({ required: false, defaultValue: 50 }),
    },
    resolve: async (_, { limit }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      return billingService.getCreditHistory(
        ctx.session.activeOrganizationId,
        limit || 50
      );
    },
  })
);

/**
 * Get available billing plans
 */
builder.queryField("billingPlans", (t) =>
  t.field({
    type: [BillingPlanType],
    resolve: () => {
      return Object.values(saasConfig.billing.plans).map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        creditsPerMonth: "creditsPerMonth" in plan ? plan.creditsPerMonth : undefined,
        features: [...plan.features], // Convert readonly array to mutable
      }));
    },
  })
);

/**
 * Get available credit packs
 */
builder.queryField("creditPacks", (t) =>
  t.field({
    type: [CreditPackType],
    resolve: () => {
      return saasConfig.billing.creditPacks.map((pack) => ({
        id: pack.id,
        name: pack.name,
        credits: pack.credits,
        price: pack.price,
      }));
    },
  })
);

// === MUTATIONS ===

/**
 * Create checkout session for a subscription plan
 */
builder.mutationField("createCheckout", (t) =>
  t.field({
    type: CheckoutResultType,
    args: {
      planId: t.arg.string({ required: true }),
      interval: t.arg.string({ required: false }), // "monthly" | "yearly"
    },
    resolve: async (_, { planId, interval }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      const result = await billingService.createCheckout(
        ctx.session.activeOrganizationId,
        planId,
        interval as "monthly" | "yearly" | undefined
      );

      return {
        url: result.checkoutUrl,
        sessionId: result.sessionId,
      };
    },
  })
);

/**
 * Create checkout session for credit pack purchase
 */
builder.mutationField("createCreditCheckout", (t) =>
  t.field({
    type: CheckoutResultType,
    args: {
      packId: t.arg.string({ required: true }),
    },
    resolve: async (_, { packId }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      const result = await billingService.createCreditCheckout(
        ctx.session.activeOrganizationId,
        packId
      );

      return {
        url: result.checkoutUrl,
        sessionId: result.sessionId,
      };
    },
  })
);

/**
 * Create customer portal session for subscription management
 */
builder.mutationField("createCustomerPortal", (t) =>
  t.field({
    type: CustomerPortalResultType,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      const result = await billingService.createCustomerPortal(
        ctx.session.activeOrganizationId
      );

      return { url: result.portalUrl };
    },
  })
);

/**
 * Billing GraphQL Schema (Pothos)
 *
 * Defines GraphQL types for billing operations.
 * Uses Pothos code-first approach for full type safety.
 */

import { builder } from "@/lib/graphql/builder";

// === OBJECT TYPES ===

/**
 * Credit Balance Response
 */
export const CreditBalanceType = builder
  .objectRef<{
    balance: number;
    planId: string;
    subscriptionStatus?: string;
    cancelAtPeriodEnd?: boolean;
    subscriptionEndDate?: Date;
    currentPeriodEnd?: Date;
  }>("CreditBalance")
  .implement({
    fields: (t) => ({
      balance: t.exposeInt("balance", {
        description: "Current credit balance",
      }),
      planId: t.exposeString("planId", {
        description: "Current subscription plan ID",
      }),
      subscriptionStatus: t.exposeString("subscriptionStatus", {
        nullable: true,
        description: "Subscription status (active, canceled, etc.)",
      }),
      cancelAtPeriodEnd: t.exposeBoolean("cancelAtPeriodEnd", {
        nullable: true,
        description: "Whether subscription is scheduled to cancel at period end",
      }),
      subscriptionEndDate: t.field({
        type: "DateTime",
        nullable: true,
        resolve: (parent) => parent.subscriptionEndDate,
        description: "Date when canceled subscription will actually end",
      }),
      currentPeriodEnd: t.field({
        type: "DateTime",
        nullable: true,
        resolve: (parent) => parent.currentPeriodEnd,
        description: "End date of current billing period",
      }),
    }),
  });

/**
 * Credit Transaction
 */
export const CreditTransactionType = builder
  .objectRef<{
    id: string;
    amount: number;
    type: string;
    description: string;
    balanceAfter: number;
    createdAt: Date;
    metadata?: any;
  }>("CreditTransaction")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      amount: t.exposeInt("amount", {
        description: "Credit amount (positive for additions, negative for usage)",
      }),
      type: t.exposeString("type", {
        description: "Transaction type: purchase, usage, refund, adjustment, subscription_grant",
      }),
      description: t.exposeString("description"),
      balanceAfter: t.exposeInt("balanceAfter", {
        description: "Credit balance after this transaction",
      }),
      createdAt: t.field({
        type: "DateTime",
        resolve: (parent) => parent.createdAt,
      }),
      metadata: t.field({
        type: "JSON",
        nullable: true,
        resolve: (parent) => parent.metadata,
      }),
    }),
  });

/**
 * Checkout Result
 */
export const CheckoutResultType = builder
  .objectRef<{ url: string; sessionId?: string }>("CheckoutResult")
  .implement({
    fields: (t) => ({
      url: t.exposeString("url", {
        description: "Stripe checkout URL to redirect user to",
      }),
      sessionId: t.exposeString("sessionId", {
        nullable: true,
        description: "Stripe checkout session ID",
      }),
    }),
  });

/**
 * Customer Portal Result
 */
export const CustomerPortalResultType = builder
  .objectRef<{ url: string }>("CustomerPortalResult")
  .implement({
    fields: (t) => ({
      url: t.exposeString("url", {
        description: "Stripe customer portal URL",
      }),
    }),
  });

/**
 * Billing Plan Info (from config)
 */
export const BillingPlanType = builder
  .objectRef<{
    id: string;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    creditsPerMonth?: number;
    features: string[];
  }>("BillingPlan")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      name: t.exposeString("name"),
      description: t.exposeString("description"),
      priceMonthly: t.exposeInt("priceMonthly", {
        description: "Monthly price in dollars",
      }),
      priceYearly: t.exposeInt("priceYearly", {
        description: "Yearly price in dollars",
      }),
      creditsPerMonth: t.exposeInt("creditsPerMonth", {
        nullable: true,
        description: "Monthly credit grant for hybrid billing",
      }),
      features: t.field({
        type: ["String"],
        resolve: (parent) => parent.features,
      }),
    }),
  });

/**
 * Credit Pack Info (from config)
 */
export const CreditPackType = builder
  .objectRef<{
    id: string;
    name: string;
    credits: number;
    price: number;
  }>("CreditPack")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      name: t.exposeString("name"),
      credits: t.exposeInt("credits"),
      price: t.exposeInt("price", {
        description: "Price in dollars",
      }),
    }),
  });

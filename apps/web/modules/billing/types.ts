// Billing TypeScript Types

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type TransactionType =
  | "purchase"
  | "usage"
  | "refund"
  | "adjustment"
  | "subscription_grant";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "uncollectible"
  | "void";

export interface CreditTransaction {
  id: string;
  organizationId: string;
  amount: number;
  type: TransactionType;
  description: string;
  metadata?: Record<string, any>;
  balanceAfter: number;
  createdAt: Date;
  createdBy?: string;
}

export interface OrganizationBilling {
  id: string;
  organizationId: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  planId?: string;
  creditBalance: number;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface EntitlementCheck {
  allowed: boolean;
  reason?: string;
}

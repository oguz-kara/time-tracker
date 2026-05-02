import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, index, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./auth";

// Enums for type safety
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "incomplete",
  "incomplete_expired",
  "unpaid"
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "purchase",
  "usage",
  "refund",
  "adjustment",
  "subscription_grant"
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "uncollectible",
  "void"
]);

// Organization billing table
export const organizationBilling = pgTable("organization_billing", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" })
    .unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  subscriptionId: varchar("subscription_id", { length: 255 }),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  planId: varchar("plan_id", { length: 100 }),
  creditBalance: integer("credit_balance").default(0).notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  // Cancellation tracking
  canceledAt: timestamp("canceled_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  subscriptionEndDate: timestamp("subscription_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index("idx_organization_billing_org_id").on(table.organizationId),
  stripeCustomerIdIdx: index("idx_organization_billing_stripe_customer_id").on(table.stripeCustomerId),
}));

// Credit transactions table (append-only ledger)
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Positive for additions, negative for usage
  type: transactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Structured metadata (e.g., { feature: "ai-generation", model: "gpt-4", tokens: 1500 })
  balanceAfter: integer("balance_after").notNull(), // Running balance after this transaction
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by"), // User who triggered the transaction (optional)
}, (table) => ({
  organizationIdIdx: index("idx_credit_transactions_org_id").on(table.organizationId),
  createdAtIdx: index("idx_credit_transactions_created_at").on(table.createdAt),
}));

// Subscription plans table (for credit packs and plan configs)
export const plans = pgTable("plans", {
  id: varchar("id", { length: 100 }).primaryKey(), // e.g., "pro", "enterprise"
  name: text("name").notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly"), // In cents
  priceYearly: integer("price_yearly"), // In cents
  creditsPerMonth: integer("credits_per_month"), // For hybrid billing
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
  features: jsonb("features"), // Array of feature strings or feature objects
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Credit packs table (for one-time credit purchases)
export const creditPacks = pgTable("credit_packs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  price: integer("price").notNull(), // In cents
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoices table (for tracking Stripe invoices)
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).unique(),
  amount: integer("amount").notNull(), // In cents
  status: invoiceStatusEnum("status").notNull(),
  invoiceUrl: text("invoice_url"),
  invoicePdf: text("invoice_pdf"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
}, (table) => ({
  organizationIdIdx: index("idx_invoices_org_id").on(table.organizationId),
  stripeInvoiceIdIdx: index("idx_invoices_stripe_invoice_id").on(table.stripeInvoiceId),
}));

// Relations
export const organizationBillingRelations = relations(organizationBilling, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [organizationBilling.organizationId],
    references: [organizations.id],
  }),
  transactions: many(creditTransactions),
  invoices: many(invoices),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  organization: one(organizations, {
    fields: [creditTransactions.organizationId],
    references: [organizations.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
}));

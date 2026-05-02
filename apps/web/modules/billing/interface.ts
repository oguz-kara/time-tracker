// Billing Provider Interface
// Defines the contract that all billing providers (Stripe, Paddle, Lemon Squeezy) must implement

export interface BillingProvider {
  // Checkout
  createCheckoutSession(params: {
    planId: string;
    customerId?: string;
    organizationId: string;
    successUrl: string;
    cancelUrl: string;
    mode: "subscription" | "payment"; // subscription or one-time
    interval?: "monthly" | "yearly"; // billing interval for subscriptions
  }): Promise<{ url: string; sessionId: string }>;

  // Portal
  createCustomerPortal(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;

  // Credits (one-time purchase)
  createCreditPurchase(params: {
    packId: string;
    customerId: string;
    organizationId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string }>;

  // Webhooks
  handleWebhook(payload: string, signature: string): Promise<BillingEvent>;

  // Customer management
  createCustomer(params: {
    email: string;
    name?: string;
    orgId: string;
  }): Promise<{ customerId: string }>;

  // Subscription management
  cancelSubscription(subscriptionId: string): Promise<{ success: boolean }>;

  // Health check
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}

export type BillingEvent =
  | {
      type: "ignored";
      data: Record<string, never>;
    }
  | {
      type: "checkout.completed";
      data: {
        customerId: string;
        planId?: string;
        credits?: number;
        orgId: string;
      };
    }
  | {
      type: "subscription.created";
      data: {
        customerId: string;
        planId: string;
        orgId: string;
        subscriptionId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
      };
    }
  | {
      type: "subscription.updated";
      data: {
        customerId: string;
        planId: string;
        orgId: string;
        subscriptionId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd?: boolean;
        canceledAt?: Date;
      };
    }
  | {
      type: "subscription.canceled";
      data: {
        customerId: string;
        orgId: string;
        subscriptionId: string;
        canceledAt: Date;
        subscriptionEndDate?: Date;
      };
    }
  | {
      type: "subscription.deleted";
      data: {
        customerId: string;
        orgId: string;
        subscriptionId: string;
      };
    }
  | {
      type: "payment.succeeded";
      data: {
        amount: number;
        customerId: string;
        orgId: string;
      };
    }
  | {
      type: "payment.failed";
      data: {
        customerId: string;
        orgId: string;
        reason: string;
      };
    };

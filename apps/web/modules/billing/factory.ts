/**
 * Billing Provider Factory
 *
 * Creates billing provider instances based on configuration.
 * Follows the adapter pattern to allow swapping providers (Stripe → Paddle → Lemon Squeezy)
 * without changing business logic.
 *
 * Usage:
 *   const billingProvider = createBillingProvider();
 *   await billingProvider.createCheckoutSession({ ... });
 */

import type { BillingProvider } from "./interface";
import { StripeAdapter } from "./adapters/stripe";
import { saasConfig } from "@/saas.config";

/**
 * Creates a billing provider instance based on configuration
 *
 * @throws {Error} If required environment variables are missing
 * @throws {Error} If provider is not supported
 */
export function createBillingProvider(): BillingProvider {
  const provider = saasConfig.features.billing.provider;

  switch (provider) {
    case "stripe": {
      const secretKey = process.env.STRIPE_SECRET_KEY;

      if (!secretKey) {
        throw new Error(
          "STRIPE_SECRET_KEY environment variable is required for billing"
        );
      }

      return new StripeAdapter(secretKey);
    }

    // Future providers can be added here:
    // case 'paddle':
    //   return new PaddleAdapter(process.env.PADDLE_API_KEY!);
    // case 'lemon_squeezy':
    //   return new LemonSqueezyAdapter(process.env.LEMON_SQUEEZY_API_KEY!);

    default:
      throw new Error(`Unknown billing provider: ${provider}`);
  }
}

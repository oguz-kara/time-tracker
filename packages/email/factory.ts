/**
 * Email Provider Factory
 *
 * Creates email provider instances based on configuration.
 * Follows the adapter pattern to allow swapping providers (Resend → SendGrid → Postmark)
 * without changing business logic.
 *
 * Usage:
 *   const emailProvider = createEmailProvider();
 *   await emailProvider.send({ to: 'user@example.com', subject: '...', html: '...' });
 */

import type { EmailProvider } from "./interface";
import { ResendAdapter } from "./adapters/resend";

/**
 * Creates an email provider instance based on environment configuration
 *
 * @throws {Error} If required environment variables are missing
 * @throws {Error} If provider is not supported
 */
export function createEmailProvider(): EmailProvider {
  // For now, we hardcode Resend. Later this can read from saasConfig.features.email.provider
  const provider = "resend" as const;

  switch (provider) {
    case "resend": {
      const apiKey = process.env.RESEND_API_KEY;
      const defaultFrom = process.env.EMAIL_FROM || "noreply@jetframe.io";

      if (!apiKey) {
        throw new Error(
          "RESEND_API_KEY environment variable is required for email sending"
        );
      }

      return new ResendAdapter(apiKey, defaultFrom);
    }

    // Future providers can be added here:
    // case 'sendgrid':
    //   return new SendGridAdapter(process.env.SENDGRID_API_KEY!);
    // case 'postmark':
    //   return new PostmarkAdapter(process.env.POSTMARK_API_KEY!);

    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

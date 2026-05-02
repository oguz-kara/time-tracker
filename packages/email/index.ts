/**
 * Email Package Exports
 *
 * This package provides email infrastructure for JetFrame:
 * - Provider adapters (Resend, SendGrid, Postmark)
 * - React Email templates
 * - Factory for creating email provider instances
 */

// Core infrastructure
export { createEmailProvider } from "./factory";
export type {
  EmailProvider,
  SendEmailParams,
  EmailResult,
  BatchEmailResult,
  EmailTag,
} from "./interface";

// Email templates
export { MagicLinkEmail } from "./emails/magic-link";
export type { MagicLinkEmailProps } from "./emails/magic-link";
export { WelcomeEmail } from "./emails/welcome";
export type { WelcomeEmailProps } from "./emails/welcome";

// Layout components
export { BaseLayout } from "./components/base";

// Adapters (usually not imported directly, but available for testing)
export { ResendAdapter } from "./adapters/resend";

/**
 * Email Service Module
 *
 * High-level business logic for sending emails.
 * This module provides simple functions that other modules can call.
 *
 * Philosophy:
 * - Direct send (no Inngest queue for MVP)
 * - Synchronous for magic links (Better-Auth requirement)
 * - Uses React Email templates + Resend adapter
 */

import { render } from "@react-email/render";
import { createEmailProvider } from "@jetframe/email";
import { MagicLinkEmail, WelcomeEmail } from "@jetframe/email";
import { EmailSendError } from "@/modules/shared/errors";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Send magic link email for passwordless authentication
 *
 * @param email - User's email address
 * @param magicLink - Full magic link URL
 * @throws {EmailSendError} If email sending fails
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLink: string
): Promise<void> {
  try {
    // Render React Email template to HTML
    const html = await render(
      MagicLinkEmail({
        email,
        magicLink,
        expiresIn: "15 minutes",
      })
    );

    // Send via email provider (Resend)
    const emailProvider = createEmailProvider();
    await emailProvider.send({
      to: email,
      subject: "Sign in to JetFrame",
      html,
      tags: [{ name: "type", value: "magic-link" }],
    });
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    throw new EmailSendError(
      `Failed to send magic link to ${email}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Send welcome email after user signup
 *
 * @param user - User object with email and name
 * @throws {EmailSendError} If email sending fails
 */
export async function sendWelcomeEmail(user: {
  email: string;
  name: string;
}): Promise<void> {
  try {
    // Render React Email template to HTML
    const html = await render(
      WelcomeEmail({
        name: user.name,
        dashboardUrl: `${APP_URL}/dashboard`,
      })
    );

    // Send via email provider (Resend)
    const emailProvider = createEmailProvider();
    await emailProvider.send({
      to: user.email,
      subject: `Welcome to JetFrame, ${user.name}!`,
      html,
      tags: [{ name: "type", value: "welcome" }],
    });
  } catch (error) {
    // Log error but don't throw - welcome email failure shouldn't block user creation
    console.error("Failed to send welcome email:", error);

    // In production, you might want to queue a retry or log to monitoring
    // For now, we'll just log and continue
  }
}

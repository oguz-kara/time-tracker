/**
 * Email Provider Interface
 *
 * Defines the contract for email service providers (Resend, SendGrid, Postmark, etc.)
 * Following the adapter pattern to allow swapping providers without changing business logic.
 */

export interface EmailProvider {
  /**
   * Send a single email
   */
  send(params: SendEmailParams): Promise<EmailResult>;

  /**
   * Send multiple emails in batch
   */
  sendBatch(emails: SendEmailParams[]): Promise<BatchEmailResult>;
}

export interface SendEmailParams {
  /**
   * Recipient email address(es)
   */
  to: string | string[];

  /**
   * Email subject line
   */
  subject: string;

  /**
   * HTML content of the email
   */
  html: string;

  /**
   * Plain text version (optional, for email clients that don't support HTML)
   */
  text?: string;

  /**
   * From address (optional, uses default from env if not provided)
   */
  from?: string;

  /**
   * Reply-to address (optional)
   */
  replyTo?: string;

  /**
   * Tags for tracking and categorization (optional)
   */
  tags?: EmailTag[];
}

export interface EmailTag {
  name: string;
  value: string;
}

export interface EmailResult {
  /**
   * Unique identifier for the sent email (from provider)
   */
  messageId: string;
}

export interface BatchEmailResult {
  /**
   * Array of message IDs for all sent emails
   */
  messageIds: string[];
}

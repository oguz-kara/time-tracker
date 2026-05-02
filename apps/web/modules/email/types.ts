/**
 * Email Module Types
 *
 * Type definitions for the email service module.
 */

/**
 * User information required for sending emails
 */
export interface EmailUser {
  email: string;
  name: string;
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Resend Email Provider Adapter
 *
 * Implements the EmailProvider interface using Resend as the email service.
 * Resend provides 3,000 free emails/month with excellent DX.
 *
 * @see https://resend.com/docs
 */

import { Resend } from "resend";
import type {
  EmailProvider,
  SendEmailParams,
  EmailResult,
  BatchEmailResult,
} from "../interface";

export class ResendAdapter implements EmailProvider {
  private client: Resend;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    if (!apiKey) {
      throw new Error(
        "Resend API key is required. Set RESEND_API_KEY environment variable."
      );
    }

    this.client = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
  }

  async send(params: SendEmailParams): Promise<EmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: params.from || this.defaultFrom,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
        tags: params.tags?.map((tag) => ({
          name: tag.name,
          value: tag.value,
        })),
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      if (!data?.id) {
        throw new Error("Resend returned no message ID");
      }

      return { messageId: data.id };
    } catch (error) {
      // Re-throw with more context
      const message =
        error instanceof Error ? error.message : "Unknown error sending email";
      throw new Error(`Failed to send email via Resend: ${message}`);
    }
  }

  async sendBatch(emails: SendEmailParams[]): Promise<BatchEmailResult> {
    try {
      // Resend supports batch sending with emails.batch.send()
      // For now, we'll send them sequentially. Can optimize later if needed.
      const results = await Promise.all(emails.map((email) => this.send(email)));

      return {
        messageIds: results.map((result) => result.messageId),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error sending batch emails";
      throw new Error(`Failed to send batch emails via Resend: ${message}`);
    }
  }
}

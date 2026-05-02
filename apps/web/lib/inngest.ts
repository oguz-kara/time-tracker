/**
 * Inngest Client Setup
 *
 * Inngest handles background jobs and webhook processing with:
 * - Automatic retries
 * - Idempotency
 * - Step functions for reliable execution
 * - Visibility into job execution
 */

import { Inngest, EventSchemas } from "inngest";
import type { BillingEvent } from "@/modules/billing/interface";

// Define event schemas for type safety
type Events = {
  "billing/webhook": {
    data: BillingEvent;
  };
  "email/send": {
    data: {
      to: string;
      subject: string;
      template: string;
      data: Record<string, any>;
    };
  };
};

// Create Inngest client
export const inngest = new Inngest({
  id: "jetframe",
  schemas: new EventSchemas().fromRecord<Events>(),
  // In development, use local dev server (no event key needed)
  // In production, use cloud with event key
  eventKey: process.env.INNGEST_EVENT_KEY,
});

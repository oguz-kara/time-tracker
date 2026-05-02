ALTER TABLE "organization_billing" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization_billing" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "organization_billing" ADD COLUMN "subscription_end_date" timestamp;
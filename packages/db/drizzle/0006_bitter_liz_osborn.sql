CREATE TABLE IF NOT EXISTS "habit_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"date" date NOT NULL,
	"kind" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"times_per_week" integer,
	"status" text DEFAULT 'backlog' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"intention" text,
	"starter" text,
	"identity" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sprint_habits" (
	"sprint_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"outcome" text,
	"completion_pct" integer,
	CONSTRAINT "sprint_habits_sprint_id_habit_id_pk" PRIMARY KEY("sprint_id","habit_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"retro_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_habit_checks_habit_date" ON "habit_checks" USING btree ("habit_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_habit_checks_user_date" ON "habit_checks" USING btree ("user_id","date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_habits_user_status" ON "habits" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_sprints_active_per_user" ON "sprints" USING btree ("user_id") WHERE "sprints"."status" = 'active';

ALTER TABLE "habits"
  ADD CONSTRAINT "habits_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "habits"
  ADD CONSTRAINT "habits_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

ALTER TABLE "sprints"
  ADD CONSTRAINT "sprints_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "sprints"
  ADD CONSTRAINT "sprints_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

ALTER TABLE "sprint_habits"
  ADD CONSTRAINT "sprint_habits_sprint_id_sprints_id_fk"
  FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE;

ALTER TABLE "sprint_habits"
  ADD CONSTRAINT "sprint_habits_habit_id_habits_id_fk"
  FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE;

ALTER TABLE "habit_checks"
  ADD CONSTRAINT "habit_checks_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "habit_checks"
  ADD CONSTRAINT "habit_checks_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

ALTER TABLE "habit_checks"
  ADD CONSTRAINT "habit_checks_habit_id_habits_id_fk"
  FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE;
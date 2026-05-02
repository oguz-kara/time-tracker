import { pgTable, uuid, text, timestamp, integer, smallint, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Time Tracking Schema
 * - timeEntries: one row per Start/Stop interval. stop=null means running.
 * - userSettings: per-user singleton (PK = userId).
 *
 * FK constraints are NOT declared via .references() to avoid cross-package
 * type imports — they're added at the DB level in the migration SQL,
 * matching the existing convention in projects.ts/tasks.ts.
 */

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    start: timestamp("start").notNull(),
    stop: timestamp("stop"),
    description: text("description"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userStartIdx: index("idx_time_entries_user_start").on(table.userId, table.start.desc()),
    runningPerUser: uniqueIndex("uniq_time_entries_running_per_user")
      .on(table.userId)
      .where(sql`${table.stop} IS NULL`),
  })
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(480),
  weekStartsOn: smallint("week_starts_on").notNull().default(1),
  timezone: text("timezone").notNull().default("UTC"),
  // ISO 639-1 code; validated at the app layer ("en" | "tr").
  locale: text("locale").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

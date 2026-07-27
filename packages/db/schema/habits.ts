import { pgTable, uuid, text, integer, timestamp, date, index, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Habits Schema (spec: docs/superpowers/specs/2026-07-27-habits-design.md)
 * - habits: backlog items; lifecycle backlog → in_sprint → established/dropped.
 * - sprints: commitment windows; partial unique index = one active per user.
 * - sprint_habits: membership + retro outcome snapshot.
 * - habit_checks: one row per habit per local calendar day ('done' or 'slip').
 *
 * FK constraints are NOT declared via .references() — they're added in the
 * migration SQL, matching the time_tracking convention.
 */

export const habits = pgTable(
  "habits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    name: text("name").notNull(),
    // 'good' | 'bad' — validated in the service layer
    type: text("type").notNull(),
    // 'daily' | 'weekly'; bad habits always 'daily' (implicitly "avoid every day")
    frequency: text("frequency").notNull().default("daily"),
    timesPerWeek: integer("times_per_week"),
    // 'backlog' | 'in_sprint' | 'established' | 'dropped'
    status: text("status").notNull().default("backlog"),
    position: integer("position").notNull().default(0),
    intention: text("intention"),
    starter: text("starter"),
    identity: text("identity"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userStatusIdx: index("idx_habits_user_status").on(table.userId, table.status),
  })
);

export const sprints = pgTable(
  "sprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    name: text("name").notNull(),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    endsOn: date("ends_on", { mode: "string" }).notNull(),
    // 'active' | 'completed'
    status: text("status").notNull().default("active"),
    retroNotes: text("retro_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    activePerUser: uniqueIndex("uniq_sprints_active_per_user")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
  })
);

export const sprintHabits = pgTable(
  "sprint_habits",
  {
    sprintId: uuid("sprint_id").notNull(),
    habitId: uuid("habit_id").notNull(),
    // null while active; 'graduated' | 'carried' | 'returned' | 'dropped' once decided
    outcome: text("outcome"),
    completionPct: integer("completion_pct"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sprintId, table.habitId] }),
  })
);

export const habitChecks = pgTable(
  "habit_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    habitId: uuid("habit_id").notNull(),
    // local calendar day in the user's timezone, YYYY-MM-DD
    date: date("date", { mode: "string" }).notNull(),
    // 'done' (good habits) | 'slip' (bad habits)
    kind: text("kind").notNull(),
    count: integer("count").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    habitDateUnique: uniqueIndex("uniq_habit_checks_habit_date").on(table.habitId, table.date),
    userDateIdx: index("idx_habit_checks_user_date").on(table.userId, table.date.desc()),
  })
);

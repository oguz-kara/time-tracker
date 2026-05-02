import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { organizations } from "./auth";

/**
 * Notifications Schema
 *
 * Simple notification system for in-app alerts
 */

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Recipient
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),

  // Content
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info | success | warning | error

  // Link (optional)
  link: text("link"),

  // Status
  read: boolean("read").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

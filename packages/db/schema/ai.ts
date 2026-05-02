import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./auth";
import { users } from "./auth";

// AI Usage tracking table
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  creditsUsed: integer("credits_used").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index("idx_ai_usage_org_id").on(table.organizationId),
  createdAtIdx: index("idx_ai_usage_created_at").on(table.createdAt),
}));

// Relations
export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiUsage.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [aiUsage.userId],
    references: [users.id],
  }),
}));

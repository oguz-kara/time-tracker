import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Task Database Schema
 * Multi-tenant: All records belong to an organization
 */

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  // Foreign key: references organizations(id) ON DELETE CASCADE
  // Note: FK constraint is defined at DB level, not in code to avoid cross-package type dependencies
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Add your custom fields here
}, (table) => ({
  organizationIdIdx: index('idx_tasks_organization_id').on(table.organizationId),
}));

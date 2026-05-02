import type { InferSelectModel, InferInsertModel } from '@jetframe/db';
import { projects } from '@jetframe/db/schema/projects';

/**
 * Projects TypeScript Types
 * Inferred from database schema
 */

export type Projects = InferSelectModel<typeof projects>;
export type NewProjects = Omit<
  InferInsertModel<typeof projects>,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt'
> & {
  name: string; // Ensure name is required
};

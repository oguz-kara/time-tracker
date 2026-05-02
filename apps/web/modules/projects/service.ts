import { db, eq, and } from "@jetframe/db";
import { projects } from "@jetframe/db/schema/projects";
import type { NewProjects, Projects } from "./types";
import { NotFoundError } from "@/modules/shared/errors";

/**
 * Projects Service
 * Business logic layer - no GraphQL dependencies
 */

/**
 * List all projects for an organization
 */
export async function list(organizationId: string): Promise<Projects[]> {
  return db.query.projects.findMany({
    where: eq(projects.organizationId, organizationId),
    orderBy: (projects, { desc }) => [desc(projects.createdAt)],
  });
}

/**
 * Get a single project by ID
 */
export async function getById(
  id: string,
  organizationId: string
): Promise<Projects> {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, id),
      eq(projects.organizationId, organizationId)
    ),
  });

  if (!project) {
    throw new NotFoundError("Project");
  }

  return project;
}

/**
 * Create a new project
 */
export async function create(
  input: NewProjects,
  organizationId: string
): Promise<Projects> {
  const [project] = await db
    .insert(projects)
    .values({
      name: input.name,
      description: input.description,
      organizationId,
    })
    .returning();

  return project;
}

/**
 * Update an existing project
 */
export async function update(
  id: string,
  input: Partial<NewProjects>,
  organizationId: string
): Promise<Projects> {
  const result = await db
    .update(projects)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(eq(projects.id, id), eq(projects.organizationId, organizationId))
    )
    .returning();

  if (result.length === 0) {
    throw new NotFoundError("Project");
  }

  return result[0];
}

/**
 * Delete a project by ID
 */
export async function deleteById(
  id: string,
  organizationId: string
): Promise<void> {
  const result = await db
    .delete(projects)
    .where(
      and(eq(projects.id, id), eq(projects.organizationId, organizationId))
    )
    .returning();

  if (result.length === 0) {
    throw new NotFoundError("Project");
  }
}

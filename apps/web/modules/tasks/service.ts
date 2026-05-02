import { db, eq, and } from '@jetframe/db';
import { tasks } from '@jetframe/db/schema/tasks';
import { NotFoundError } from '@/modules/shared/errors';

export type CreateTaskInput = {
  name: string;
  description?: string;
};

export type UpdateTaskInput = {
  name?: string;
  description?: string;
};

/**
 * Task Service
 * Business logic for managing tasks
 */

export const taskService = {
  /**
   * Get all tasks for an organization
   */
  async getAllTasks(organizationId: string) {
    return db.query.tasks.findMany({
      where: eq(tasks.organizationId, organizationId),
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });
  },

  /**
   * Get a single task by ID
   */
  async getTask(id: string, organizationId: string) {
    const task = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)),
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    return task;
  },

  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput, organizationId: string) {
    const [task] = await db
      .insert(tasks)
      .values({
        ...input,
        organizationId,
      })
      .returning();

    return task;
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, input: UpdateTaskInput, organizationId: string) {
    // Verify task exists and belongs to organization
    await this.getTask(id, organizationId);

    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();

    if (!updatedTask) {
      throw new NotFoundError('Task');
    }

    return updatedTask;
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string, organizationId: string) {
    // Verify task exists and belongs to organization
    await this.getTask(id, organizationId);

    const [deletedTask] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();

    if (!deletedTask) {
      throw new NotFoundError('Task');
    }

    return deletedTask;
  },
};

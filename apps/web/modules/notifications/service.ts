/**
 * Notification Service
 *
 * Business logic for in-app notifications
 */

import { db, eq, and, desc } from "@jetframe/db";
import { notifications } from "@jetframe/db/schema/notifications";

export interface CreateNotificationInput {
  userId: string;
  organizationId?: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      organizationId: input.organizationId,
      title: input.title,
      message: input.message,
      type: input.type || "info",
      link: input.link,
    })
    .returning();

  return notification;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit = 50) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit,
  });
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string) {
  const result = await db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.read, false)
    ),
  });

  return result.length;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const [notification] = await db
    .update(notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
    .returning();

  return notification;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  await db
    .update(notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      )
    );
}

/**
 * Notification GraphQL API (Resolvers)
 *
 * Thin resolvers that delegate to the notification service
 */

import { builder } from "@/lib/graphql/builder";
import * as notificationService from "./service";
import { NotAuthenticatedError } from "@/modules/shared/errors";
import { NotificationType, UnreadCountType } from "./schema";

// === QUERIES ===

/**
 * Get user notifications
 */
builder.queryField("notifications", (t) =>
  t.field({
    type: [NotificationType],
    args: {
      limit: t.arg.int({ required: false, defaultValue: 50 }),
    },
    resolve: async (_, { limit }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      return notificationService.getUserNotifications(
        ctx.session.userId,
        limit || 50
      );
    },
  })
);

/**
 * Get unread notification count
 */
builder.queryField("unreadNotificationCount", (t) =>
  t.field({
    type: UnreadCountType,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      const count = await notificationService.getUnreadCount(
        ctx.session.userId
      );

      return { count };
    },
  })
);

// === MUTATIONS ===

/**
 * Mark notification as read
 */
builder.mutationField("markNotificationRead", (t) =>
  t.field({
    type: NotificationType,
    args: {
      notificationId: t.arg.string({ required: true }),
    },
    resolve: async (_, { notificationId }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      return notificationService.markAsRead(
        notificationId,
        ctx.session.userId
      );
    },
  })
);

/**
 * Mark all notifications as read
 */
builder.mutationField("markAllNotificationsRead", (t) =>
  t.field({
    type: "Boolean",
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      await notificationService.markAllAsRead(ctx.session.userId);
      return true;
    },
  })
);

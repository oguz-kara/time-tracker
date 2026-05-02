/**
 * Notification GraphQL Schema
 *
 * Pothos type definitions for notifications
 */

import { builder } from "@/lib/graphql/builder";

export const NotificationType = builder.objectRef<{
  id: string;
  userId: string;
  organizationId: string | null;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
  readAt: Date | null;
}>("Notification");

NotificationType.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    userId: t.exposeString("userId"),
    organizationId: t.exposeString("organizationId", { nullable: true }),
    title: t.exposeString("title"),
    message: t.exposeString("message"),
    type: t.exposeString("type"),
    link: t.exposeString("link", { nullable: true }),
    read: t.exposeBoolean("read"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    readAt: t.expose("readAt", { type: "DateTime", nullable: true }),
  }),
});

export const UnreadCountType = builder.objectRef<{
  count: number;
}>("UnreadCount");

UnreadCountType.implement({
  fields: (t) => ({
    count: t.exposeInt("count"),
  }),
});

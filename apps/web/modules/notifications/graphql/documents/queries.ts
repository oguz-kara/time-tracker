/**
 * Notification GraphQL Queries
 */

import { gql } from "graphql-request";

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int) {
    notifications(limit: $limit) {
      id
      title
      message
      type
      link
      read
      createdAt
      readAt
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadNotificationCount {
    unreadNotificationCount {
      count
    }
  }
`;

import { gql } from 'graphql-request';

/**
 * Get all users (admin only)
 */
export const GET_ADMIN_USERS = gql`
  query GetAdminUsers($page: Int, $pageSize: Int, $search: String) {
    adminUsers(page: $page, pageSize: $pageSize, search: $search) {
      users {
        id
        name
        email
        emailVerified
        createdAt
        organizationCount
      }
      total
      page
      pageSize
      hasMore
    }
  }
`;

/**
 * Get all organizations (admin only)
 */
export const GET_ADMIN_ORGANIZATIONS = gql`
  query GetAdminOrganizations($page: Int, $pageSize: Int, $search: String) {
    adminOrganizations(page: $page, pageSize: $pageSize, search: $search) {
      organizations {
        id
        name
        slug
        createdAt
        memberCount
        planId
        creditBalance
        subscriptionStatus
      }
      total
      page
      pageSize
      hasMore
    }
  }
`;

/**
 * Get dashboard statistics (admin only)
 */
export const GET_ADMIN_DASHBOARD_STATS = gql`
  query GetAdminDashboardStats {
    adminDashboardStats {
      totalUsers
      totalOrganizations
      recentSignups
    }
  }
`;

/**
 * Get system health status (admin only)
 */
export const GET_ADMIN_SYSTEM_HEALTH = gql`
  query GetAdminSystemHealth {
    adminSystemHealth {
      database {
        status
        message
        latency
      }
      stripe {
        status
        message
        latency
      }
      resend {
        status
        message
        latency
      }
      email {
        status
        message
        latency
      }
    }
  }
`;

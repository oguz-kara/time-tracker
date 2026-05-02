/**
 * Admin GraphQL Schema (Pothos)
 *
 * Defines GraphQL types for admin operations.
 * Uses Pothos code-first approach for full type safety.
 */

import { builder } from "@/lib/graphql/builder";

// === ENUM TYPES ===

export const ServiceHealthStatus = builder.enumType('ServiceHealthStatus', {
  values: ['healthy', 'unhealthy', 'degraded'] as const,
});

// === OBJECT TYPES ===

/**
 * Admin User Type
 */
export const AdminUserType = builder
  .objectRef<{
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    organizationCount: number;
  }>("AdminUser")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      name: t.exposeString("name"),
      email: t.exposeString("email"),
      emailVerified: t.exposeBoolean("emailVerified"),
      createdAt: t.field({
        type: "DateTime",
        resolve: (parent) => parent.createdAt,
      }),
      organizationCount: t.exposeInt("organizationCount", {
        description: "Number of organizations this user belongs to",
      }),
    }),
  });

/**
 * Admin Organization Type
 */
export const AdminOrganizationType = builder
  .objectRef<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    memberCount: number;
    planId: string | null;
    creditBalance: number;
    subscriptionStatus: string | null;
  }>("AdminOrganization")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      name: t.exposeString("name"),
      slug: t.exposeString("slug"),
      createdAt: t.field({
        type: "DateTime",
        resolve: (parent) => parent.createdAt,
      }),
      memberCount: t.exposeInt("memberCount"),
      planId: t.exposeString("planId", {
        nullable: true,
      }),
      creditBalance: t.exposeInt("creditBalance"),
      subscriptionStatus: t.exposeString("subscriptionStatus", {
        nullable: true,
      }),
    }),
  });

/**
 * Paginated Users
 */
export const PaginatedUsersType = builder
  .objectRef<{
    users: Array<any>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }>("PaginatedUsers")
  .implement({
    fields: (t) => ({
      users: t.field({
        type: [AdminUserType],
        resolve: (parent) => parent.users,
      }),
      total: t.exposeInt("total"),
      page: t.exposeInt("page"),
      pageSize: t.exposeInt("pageSize"),
      hasMore: t.exposeBoolean("hasMore"),
    }),
  });

/**
 * Paginated Organizations
 */
export const PaginatedOrganizationsType = builder
  .objectRef<{
    organizations: Array<any>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }>("PaginatedOrganizations")
  .implement({
    fields: (t) => ({
      organizations: t.field({
        type: [AdminOrganizationType],
        resolve: (parent) => parent.organizations,
      }),
      total: t.exposeInt("total"),
      page: t.exposeInt("page"),
      pageSize: t.exposeInt("pageSize"),
      hasMore: t.exposeBoolean("hasMore"),
    }),
  });

/**
 * Dashboard Stats
 */
export const DashboardStatsType = builder
  .objectRef<{
    totalUsers: number;
    totalOrganizations: number;
    recentSignups: number;
  }>("DashboardStats")
  .implement({
    fields: (t) => ({
      totalUsers: t.exposeInt("totalUsers"),
      totalOrganizations: t.exposeInt("totalOrganizations"),
      recentSignups: t.exposeInt("recentSignups", {
        description: "New user signups in the last 7 days",
      }),
    }),
  });

/**
 * Service Health
 */
export const ServiceHealthType = builder
  .objectRef<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    latency?: number;
  }>("ServiceHealth")
  .implement({
    fields: (t) => ({
      status: t.field({
        type: ServiceHealthStatus,
        resolve: (parent) => parent.status,
      }),
      message: t.exposeString("message", {
        nullable: true,
      }),
      latency: t.exposeInt("latency", {
        nullable: true,
        description: "Response time in milliseconds",
      }),
    }),
  });

/**
 * Health Status
 */
export const HealthStatusType = builder
  .objectRef<{
    database: any;
    stripe: any;
    resend: any;
    email: any;
  }>("HealthStatus")
  .implement({
    fields: (t) => ({
      database: t.field({
        type: ServiceHealthType,
        resolve: (parent) => parent.database,
      }),
      stripe: t.field({
        type: ServiceHealthType,
        resolve: (parent) => parent.stripe,
      }),
      resend: t.field({
        type: ServiceHealthType,
        resolve: (parent) => parent.resend,
      }),
      email: t.field({
        type: ServiceHealthType,
        resolve: (parent) => parent.email,
      }),
    }),
  });

/**
 * Credit Adjustment Result
 */
export const CreditAdjustmentResultType = builder
  .objectRef<{
    organizationId: string;
    previousBalance: number;
    newBalance: number;
    adjustmentAmount: number;
    reason: string;
  }>("CreditAdjustmentResult")
  .implement({
    fields: (t) => ({
      organizationId: t.exposeID("organizationId"),
      previousBalance: t.exposeInt("previousBalance"),
      newBalance: t.exposeInt("newBalance"),
      adjustmentAmount: t.exposeInt("adjustmentAmount"),
      reason: t.exposeString("reason"),
    }),
  });

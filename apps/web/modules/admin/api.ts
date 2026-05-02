/**
 * Admin GraphQL API (Resolvers)
 *
 * Thin resolvers that delegate to the admin service layer.
 * All resolvers require admin authentication via requireAdmin middleware.
 */

import { builder } from "@/lib/graphql/builder";
import * as adminService from "./service";
import { requireAdmin } from "./middleware";
import {
  AdminUserType,
  AdminOrganizationType,
  PaginatedUsersType,
  PaginatedOrganizationsType,
  DashboardStatsType,
  HealthStatusType,
  CreditAdjustmentResultType,
} from "./schema";

// === QUERIES ===

/**
 * List all users (admin only)
 */
builder.queryField("adminUsers", (t) =>
  t.field({
    type: PaginatedUsersType,
    args: {
      page: t.arg.int({ required: false, defaultValue: 1 }),
      pageSize: t.arg.int({ required: false, defaultValue: 20 }),
      search: t.arg.string({ required: false }),
    },
    resolve: async (_, { page, pageSize, search }, ctx) => {
      requireAdmin(ctx);
      return adminService.listUsers({ page: page || 1, pageSize: pageSize || 20, search: search || undefined });
    },
  })
);

/**
 * List all organizations (admin only)
 */
builder.queryField("adminOrganizations", (t) =>
  t.field({
    type: PaginatedOrganizationsType,
    args: {
      page: t.arg.int({ required: false, defaultValue: 1 }),
      pageSize: t.arg.int({ required: false, defaultValue: 20 }),
      search: t.arg.string({ required: false }),
    },
    resolve: async (_, { page, pageSize, search }, ctx) => {
      requireAdmin(ctx);
      return adminService.listOrganizations({ page: page || 1, pageSize: pageSize || 20, search: search || undefined });
    },
  })
);

/**
 * Get dashboard statistics (admin only)
 */
builder.queryField("adminDashboardStats", (t) =>
  t.field({
    type: DashboardStatsType,
    resolve: async (_, __, ctx) => {
      requireAdmin(ctx);
      return adminService.getDashboardStats();
    },
  })
);

/**
 * Get system health status (admin only)
 */
builder.queryField("adminSystemHealth", (t) =>
  t.field({
    type: HealthStatusType,
    resolve: async (_, __, ctx) => {
      requireAdmin(ctx);
      return adminService.getSystemHealth();
    },
  })
);

// === MUTATIONS ===

/**
 * Adjust credits for an organization (admin only)
 */
builder.mutationField("adminAdjustCredits", (t) =>
  t.field({
    type: CreditAdjustmentResultType,
    args: {
      organizationId: t.arg.string({ required: true }),
      amount: t.arg.int({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: async (_, { organizationId, amount, reason }, ctx) => {
      requireAdmin(ctx);
      return adminService.adjustCredits(organizationId, amount, reason);
    },
  })
);

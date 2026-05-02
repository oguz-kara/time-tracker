/**
 * Admin Module Types
 */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  organizationCount: number;
};

export type AdminOrganization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  memberCount: number;
  planId: string | null;
  creditBalance: number;
  subscriptionStatus: string | null;
};

export type DashboardStats = {
  totalUsers: number;
  totalOrganizations: number;
  recentSignups: number; // Last 7 days
};

export type HealthStatus = {
  database: ServiceHealth;
  stripe: ServiceHealth;
  resend: ServiceHealth;
  email: ServiceHealth;
};

export type ServiceHealth = {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  latency?: number; // in ms
};

export type PaginatedUsers = {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type PaginatedOrganizations = {
  organizations: AdminOrganization[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type CreditAdjustmentResult = {
  organizationId: string;
  previousBalance: number;
  newBalance: number;
  adjustmentAmount: number;
  reason: string;
};

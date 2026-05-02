/**
 * Admin Service Layer
 *
 * Business logic for admin operations:
 * - User and organization management
 * - Dashboard statistics
 * - Credit adjustments
 * - System health monitoring
 */

import { db, eq, desc, sql } from "@jetframe/db";
import { count, ilike, gte } from "drizzle-orm";
import { users } from "@jetframe/db/schema/auth";
import { organizations, members } from "@jetframe/db/schema/auth";
import { organizationBilling } from "@jetframe/db/schema/billing";
import { addCredits } from "@/modules/billing/service";
import type {
  AdminUser,
  AdminOrganization,
  DashboardStats,
  HealthStatus,
  ServiceHealth,
  PaginatedUsers,
  PaginatedOrganizations,
  CreditAdjustmentResult,
} from "./types";

// === USER MANAGEMENT ===

/**
 * List all users with pagination and search
 */
export async function listUsers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedUsers> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // Build where clause
  const whereClause = params.search
    ? sql`${users.email} ILIKE ${`%${params.search}%`} OR ${users.name} ILIKE ${`%${params.search}%`}`
    : undefined;

  // Get total count
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(whereClause);

  // Get paginated users with organization count
  const usersResult = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get organization count for each user
  const usersWithOrgCount: AdminUser[] = await Promise.all(
    usersResult.map(async (user) => {
      const [{ orgCount }] = await db
        .select({ orgCount: sql<number>`count(*)::int` })
        .from(members)
        .where(eq(members.userId, user.id));

      return {
        id: user.id,
        name: user.name || '',
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        organizationCount: orgCount,
      };
    })
  );

  return {
    users: usersWithOrgCount,
    total,
    page,
    pageSize,
    hasMore: offset + pageSize < total,
  };
}

// === ORGANIZATION MANAGEMENT ===

/**
 * List all organizations with pagination and search
 */
export async function listOrganizations(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedOrganizations> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // Build where clause
  const whereClause = params.search
    ? sql`${organizations.name} ILIKE ${`%${params.search}%`} OR ${organizations.slug} ILIKE ${`%${params.search}%`}`
    : undefined;

  // Get total count
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(organizations)
    .where(whereClause);

  // Get paginated organizations
  const orgsResult = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .where(whereClause)
    .orderBy(desc(organizations.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get member count and billing info for each organization
  const orgsWithDetails: AdminOrganization[] = await Promise.all(
    orgsResult.map(async (org) => {
      const [{ memberCount }] = await db
        .select({ memberCount: sql<number>`count(*)::int` })
        .from(members)
        .where(eq(members.organizationId, org.id));

      const billing = await db.query.organizationBilling.findFirst({
        where: eq(organizationBilling.organizationId, org.id),
      });

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        memberCount,
        planId: billing?.planId || null,
        creditBalance: billing?.creditBalance || 0,
        subscriptionStatus: billing?.subscriptionStatus || null,
      };
    })
  );

  return {
    organizations: orgsWithDetails,
    total,
    page,
    pageSize,
    hasMore: offset + pageSize < total,
  };
}

// === DASHBOARD STATS ===

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)::int` })
    .from(users);

  const [{ totalOrganizations }] = await db
    .select({ totalOrganizations: sql<number>`count(*)::int` })
    .from(organizations);

  // Get signups from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [{ recentSignups }] = await db
    .select({ recentSignups: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`${users.createdAt} >= ${sevenDaysAgo}`);

  return {
    totalUsers,
    totalOrganizations,
    recentSignups,
  };
}

// === CREDIT ADJUSTMENTS ===

/**
 * Adjust credits for an organization (admin override)
 */
export async function adjustCredits(
  orgId: string,
  amount: number,
  reason: string
): Promise<CreditAdjustmentResult> {
  // Get current balance
  const billing = await db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.organizationId, orgId),
  });

  const previousBalance = billing?.creditBalance || 0;

  // Use billing service's addCredits (works with negative amounts for deductions)
  await addCredits(orgId, amount, 'adjustment', reason);

  const newBalance = previousBalance + amount;

  return {
    organizationId: orgId,
    previousBalance,
    newBalance,
    adjustmentAmount: amount,
    reason,
  };
}

// === HEALTH MONITORING ===

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  try {
    const start = Date.now();
    await db.select({ count: sql<number>`count(*)::int` }).from(users).limit(1);
    const latency = Date.now() - start;

    return {
      status: latency < 1000 ? 'healthy' : 'degraded',
      latency,
      message: latency < 1000 ? 'Database responding normally' : 'Database responding slowly',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Check Stripe API health
 */
async function checkStripeHealth(): Promise<ServiceHealth> {
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-11-17.clover',
    });

    const start = Date.now();
    await stripe.balance.retrieve();
    const latency = Date.now() - start;

    return {
      status: latency < 2000 ? 'healthy' : 'degraded',
      latency,
      message: latency < 2000 ? 'Stripe API responding normally' : 'Stripe API responding slowly',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Stripe API connection failed',
    };
  }
}

/**
 * Check Resend API health
 */
async function checkResendHealth(): Promise<ServiceHealth> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const start = Date.now();
    // Just check API key validity (doesn't send email)
    await resend.apiKeys.list();
    const latency = Date.now() - start;

    return {
      status: latency < 2000 ? 'healthy' : 'degraded',
      latency,
      message: latency < 2000 ? 'Resend API responding normally' : 'Resend API responding slowly',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Resend API connection failed',
    };
  }
}

/**
 * Check email service health
 */
async function checkEmailHealth(): Promise<ServiceHealth> {
  try {
    const start = Date.now();
    // Check if React Email server is accessible
    const response = await fetch('http://localhost:3001', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;

    if (response.ok) {
      return {
        status: 'healthy',
        latency,
        message: 'Email preview server responding',
      };
    }

    return {
      status: 'degraded',
      message: 'Email preview server not accessible (non-critical)',
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Email preview server not running (non-critical)',
    };
  }
}

/**
 * Get overall system health status
 */
export async function getSystemHealth(): Promise<HealthStatus> {
  const [database, stripe, resend, email] = await Promise.all([
    checkDatabaseHealth(),
    checkStripeHealth(),
    checkResendHealth(),
    checkEmailHealth(),
  ]);

  return {
    database,
    stripe,
    resend,
    email,
  };
}

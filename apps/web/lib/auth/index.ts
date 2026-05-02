import { headers } from "next/headers";
import { auth as betterAuth } from "./server";
import { db } from "@jetframe/db";

/**
 * Auth utility functions
 * Integrates Better-Auth with JETFrame's multi-tenant architecture
 */

export type Session = {
  userId: string;
  email: string;
  activeOrganizationId: string;
  role: "owner" | "admin" | "member";
  token?: string;
} | null;

/**
 * Get session from request
 * Supports both Cookie (web) and Bearer token (mobile) authentication
 *
 * Returns session with:
 * - userId: The authenticated user's ID
 * - activeOrganizationId: User's primary organization (first membership)
 * - role: User's role in the active organization
 * - token: Optional Bearer token for mobile clients
 */
export async function auth(): Promise<Session> {
  try {
    // Get session from Better-Auth (handles cookie-based auth)
    const session = await betterAuth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    // Fetch user's active organization (first membership by creation date)
    const userMemberships = await db.query.members.findMany({
      where: (m, { eq }) => eq(m.userId, session.user.id),
      orderBy: (m, { asc }) => asc(m.createdAt),
      limit: 1,
    });

    if (!userMemberships.length) {
      console.warn(`User ${session.user.id} has no organization memberships`);
      return null;
    }

    const membership = userMemberships[0];

    return {
      userId: session.user.id,
      email: session.user.email,
      activeOrganizationId: membership.organizationId,
      role: membership.role as "owner" | "admin" | "member",
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get session from Bearer token
 * Used for mobile apps and API clients
 *
 * @param token - The Bearer token from Authorization header
 */
export async function authFromToken(token: string): Promise<Session> {
  try {
    // Validate token with Better-Auth
    const session = await betterAuth.api.getSession({
      headers: new Headers({
        Authorization: `Bearer ${token}`,
      }),
    });

    if (!session?.user) {
      return null;
    }

    // Fetch user's active organization
    const userMemberships = await db.query.members.findMany({
      where: (m, { eq }) => eq(m.userId, session.user.id),
      orderBy: (m, { asc }) => asc(m.createdAt),
      limit: 1,
    });

    if (!userMemberships.length) {
      return null;
    }

    const membership = userMemberships[0];

    return {
      userId: session.user.id,
      email: session.user.email,
      activeOrganizationId: membership.organizationId,
      role: membership.role as "owner" | "admin" | "member",
      token,
    };
  } catch (error) {
    console.error("Error validating token:", error);
    return null;
  }
}

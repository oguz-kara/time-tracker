import { db } from "@jetframe/db";
import { NotFoundError } from "@/modules/shared/errors";

/**
 * Organizations Service
 * Business logic for organization management
 */

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  logo: string | null;
};

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(
  userId: string
): Promise<UserOrganization[]> {
  const memberships = await db.query.members.findMany({
    where: (m, { eq }) => eq(m.userId, userId),
    with: {
      organization: true,
    },
    orderBy: (m, { asc }) => asc(m.createdAt),
  });

  return memberships
    .filter((m) => m.organization)
    .map((m) => ({
      id: m.organization!.id,
      name: m.organization!.name,
      slug: m.organization!.slug,
      logo: m.organization!.logo,
      role: m.role,
    }));
}

/**
 * Get a single organization by ID
 */
export async function getById(organizationId: string) {
  const org = await db.query.organizations.findFirst({
    where: (orgs, { eq }) => eq(orgs.id, organizationId),
  });

  if (!org) {
    throw new NotFoundError("Organization");
  }

  return org;
}

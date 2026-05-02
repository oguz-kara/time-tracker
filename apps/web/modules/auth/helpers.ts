import { db } from '@jetframe/db';
import { organizations } from '@jetframe/db/schema/auth';
import { eq } from 'drizzle-orm';
import { saasConfig } from '@/saas.config';
import { NotFoundError } from '@/modules/shared/errors';

/**
 * Get the effective organization ID for a user
 * - B2C mode: Returns the user's personal organization (auto-created on signup)
 * - B2B mode: Should use activeOrganizationId from session context
 *
 * @param userId - The user's ID
 * @returns The organization ID to use for queries
 */
export async function getEffectiveOrg(userId: string): Promise<string> {
  if (saasConfig.mode === 'b2c') {
    // In B2C mode, find the user's personal organization
    // Personal orgs are identified by having the user as a member
    // (in the simplified MVP, we don't have an explicit "type" field)
    const userOrgs = await db.query.members.findMany({
      where: (members, { eq }) => eq(members.userId, userId),
      with: {
        organization: true,
      },
    });

    // Return the first organization (in B2C, users typically have one personal org)
    if (userOrgs.length === 0) {
      throw new NotFoundError('Organization');
    }

    return userOrgs[0].organizationId;
  }

  // B2B mode: This function shouldn't be called directly in B2B
  // Instead, use ctx.session.activeOrganizationId from the session
  throw new Error('B2B mode requires session context with activeOrganizationId');
}

/**
 * Check if multi-tenancy UI should be shown
 * This helps conditionally render team/org management UI
 */
export function shouldShowMultiTenancy(): boolean {
  return saasConfig.features.multiTenancy && saasConfig.mode === 'b2b';
}

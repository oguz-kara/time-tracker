import { Context } from '@/lib/graphql/context';
import { NotAuthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { saasConfig } from '@/saas.config';

/**
 * Verify that the current user is a system admin
 * Checks against email whitelist in saas.config.ts
 *
 * @throws NotAuthorizedError if user is not authenticated
 * @throws ForbiddenError if user is not in admin whitelist
 */
export function requireAdmin(ctx: Context): void {
  // Check if user is authenticated
  if (!ctx.session) {
    throw new NotAuthorizedError('You must be logged in to access admin features');
  }

  // Check if admin feature is enabled
  if (!saasConfig.features.admin.enabled) {
    throw new ForbiddenError('Admin features are disabled');
  }

  // Check if user email is in admin whitelist
  const adminEmails: readonly string[] = saasConfig.features.admin.emails || [];

  if (!adminEmails.includes(ctx.session.email)) {
    throw new ForbiddenError('Admin access required');
  }
}

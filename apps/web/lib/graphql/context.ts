import { auth, type Session } from '@/lib/auth';
import { db } from '@jetframe/db';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/modules/shared/middleware/rate-limit/service';
import { getRateLimitIdentifier } from '@/modules/shared/utils/ip';
import { saasConfig } from '@/saas.config';

export interface Context {
  session: Session;
  db: typeof db;
  req: NextRequest;
}

/**
 * Creates the GraphQL context for each request
 * Handles both Cookie (web) and Bearer token (mobile) authentication
 * Applies rate limiting based on user ID or IP address
 */
export async function createContext(req: NextRequest): Promise<Context> {
  // 1. Try to get session from cookies first (web clients)
  let session = await auth();

  // 2. If no cookie session, check for Bearer token (mobile/API clients)
  if (!session) {
    const authHeader = req.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { authFromToken } = await import('@/lib/auth');
      session = await authFromToken(token);
    }
  }

  // 3. Apply rate limiting
  // Rate limit by user ID if authenticated, otherwise by IP address
  const identifier = getRateLimitIdentifier(req, session?.userId);
  await checkRateLimit(identifier, saasConfig.rateLimits.graphql);

  return {
    session,
    db,
    req,
  };
}

import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better-Auth API Route Handler
 *
 * Handles all authentication requests:
 * - POST /api/auth/sign-in/magic-link - Send magic link email
 * - GET  /api/auth/verify-email - Verify magic link token
 * - POST /api/auth/sign-in/social - OAuth flow initialization
 * - POST /api/auth/callback/social - OAuth callback handling
 * - POST /api/auth/sign-out - Sign out
 * - GET  /api/auth/session - Get current session
 *
 * This route uses Better-Auth's Next.js adapter for seamless integration.
 */

export const { GET, POST } = toNextJsHandler(auth);

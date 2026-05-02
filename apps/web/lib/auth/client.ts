"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/**
 * Better-Auth Client Configuration
 *
 * Provides typed React hooks for authentication in client components.
 * Supports magic link and OAuth social providers.
 *
 * Usage:
 * ```tsx
 * import { useSession, signIn, signOut } from '@/lib/auth/client';
 *
 * function LoginButton() {
 *   const { data: session } = useSession();
 *
 *   if (session) {
 *     return <button onClick={() => signOut()}>Sign Out</button>;
 *   }
 *
 *   return (
 *     <button onClick={() => signIn.magicLink({ email: 'user@example.com' })}>
 *       Send Magic Link
 *     </button>
 *   );
 * }
 * ```
 */

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [magicLinkClient()],
});

// Export typed hooks and utilities
export const {
  useSession,
  signIn,
  signOut,
  signUp,
  $fetch,
} = authClient;

// Type exports for TypeScript
export type Session = typeof useSession extends () => infer R ? R : never;

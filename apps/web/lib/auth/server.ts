import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@jetframe/db";
import { eq } from "@jetframe/db";
import * as schema from "@jetframe/db/schema/auth";
import { env } from "@/env.mjs";

/**
 * Better-Auth Server Configuration
 *
 * Implements passwordless authentication with magic links and OAuth providers.
 * Follows JETFrame architecture patterns:
 * - Multi-tenant (auto-creates personal organization on signup)
 * - Mobile-ready (supports both cookie and Bearer token auth)
 * - Provider-agnostic email sending
 */

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: false, // Passwordless authentication only
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!env.GOOGLE_CLIENT_ID,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
      enabled: !!env.GITHUB_CLIENT_ID,
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        // Dev mode: Console log the magic link for easy testing
        if (process.env.NODE_ENV === "development") {
          console.log("\n🔐 Magic Link Generated:");
          console.log("━".repeat(60));
          console.log(`📧 Email: ${email}`);
          console.log(`🔗 Link:  ${url}`);
          console.log(`🎫 Token: ${token}`);
          console.log("━".repeat(60));
          console.log("Sending email via Resend...\n");
        }

        // Send actual email via Resend (in both dev and production)
        try {
          const { sendMagicLinkEmail } = await import("@/modules/email/service");
          await sendMagicLinkEmail(email, url);

          if (process.env.NODE_ENV === "development") {
            console.log(`✅ Magic link email sent successfully to ${email}\n`);
          }
        } catch (error) {
          console.error("❌ Failed to send magic link email:", error);
          throw error; // Re-throw to let Better-Auth handle the error
        }
      },
      // Configure magic link expiration (15 minutes)
      expiresIn: 60 * 15, // 15 minutes in seconds
      // Disable auto-signup - require explicit registration
      disableSignUp: false, // Allow magic link to create new users
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        async after(user) {
          /**
           * Auto-create personal organization for new users
           *
           * Business Logic:
           * 1. Create organization with user's name or email prefix
           * 2. Generate unique slug
           * 3. Create membership with 'owner' role
           * 4. Initialize billing record with 0 credits
           *
           * This ensures every user has an activeOrganizationId for the session.
           */
          try {
            const orgName = user.name || user.email.split("@")[0];
            const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${user.id.slice(0, 8)}`;

            // Create organization (called "Workspace" in B2C mode UI)
            const [organization] = await db
              .insert(schema.organizations)
              .values({
                name: `${orgName}'s Workspace`,
                slug: orgSlug,
              })
              .returning();

            // Create owner membership
            await db.insert(schema.members).values({
              organizationId: organization.id,
              userId: user.id,
              role: "owner",
            });

            console.log(`✅ Created personal organization for user ${user.email}: ${organization.name}`);

            // Send welcome email (non-blocking - don't await)
            const { sendWelcomeEmail } = await import("@/modules/email/service");
            sendWelcomeEmail({
              email: user.email,
              name: user.name || user.email.split("@")[0],
            }).catch((error) => {
              console.error("Failed to send welcome email:", error);
              // Don't throw - welcome email failure shouldn't block user creation
            });
          } catch (error) {
            console.error("❌ Failed to create personal organization:", error);
            // Don't throw - allow user creation to succeed even if org creation fails
          }
        },
      },
    },
    session: {
      create: {
        async before(session) {
          /**
           * CRITICAL FIX: Invalidate all existing sessions for this user
           * before creating a new one.
           *
           * This prevents the session confusion bug where:
           * - User A is logged in
           * - User B clicks magic link
           * - User B sees User A's dashboard (old session still valid)
           *
           * Industry Standard: Magic link verification should invalidate
           * all existing sessions for security and UX consistency.
           */
          try {
            await db
              .delete(schema.sessions)
              .where(eq(schema.sessions.userId, session.userId));

            console.log(`🔄 Invalidated existing sessions for user ${session.userId}`);
          } catch (error) {
            console.error("❌ Failed to invalidate existing sessions:", error);
            // Don't throw - allow session creation to proceed
          }

          return { data: session };
        },
      },
    },
  },

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",

  // Enable Bearer token support for mobile apps
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "jetframe",
  },
});

export type Auth = typeof auth;

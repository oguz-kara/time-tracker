import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

/**
 * Proxy - Route Protection
 *
 * Note: Proxy always runs on Node.js runtime (cannot be configured)
 *
 * Protects routes that require authentication:
 * - /dashboard/* - Requires authenticated user
 * - /api/graphql - GraphQL API (handles auth in context)
 *
 * Public routes:
 * - /login - Auth pages
 * - /api/auth/* - Better-Auth API routes (includes magic link verification)
 * - / - Landing page
 */

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  const publicRoutes = ["/login", "/", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (pathname.startsWith("/dashboard")) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        // Redirect to login if not authenticated
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // User is authenticated, allow access
      return NextResponse.next();
    } catch (error) {
      console.error("Proxy auth error:", error);
      // Redirect to login on error
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

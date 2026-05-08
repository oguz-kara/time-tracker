import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { RedirectMessage } from "./redirect-message";

// auth() calls headers(), which Next 16 won't allow during static prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giriş",
  description:
    "DenTracker'a sihirli bağlantı ile giriş yap — şifre yok, sadece e-posta. Hesabın yoksa link ilk girişte oluşturur.",
  robots: {
    // Auth pages are not useful in search results.
    index: false,
    follow: false,
  },
};

/**
 * Login Page - Server Component
 *
 * Checks authentication server-side and handles routing:
 * - If user is already authenticated → Show redirect message
 * - If user is not authenticated → Show login form
 *
 * This provides better UX and prevents authenticated users
 * from accessing the login page unnecessarily.
 */
export default async function LoginPage() {
  // Server-side session check (no client JS needed)
  const session = await auth();

  // If user is already logged in, show redirect message
  if (session) {
    return <RedirectMessage email={session.email} />;
  }

  // Show login form for unauthenticated users
  return <LoginForm />;
}

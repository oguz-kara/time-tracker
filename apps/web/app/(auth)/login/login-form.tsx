"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "@/lib/auth/client";
import { saasConfig } from "@/saas.config";
import { Mail, Loader2, CheckCircle2, Github, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Login Form - Client Component
 *
 * Handles:
 * - Magic link email submission
 * - OAuth social sign-in
 * - Session conflict warnings
 * - Form state and error handling
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const { data: session } = useSession();

  // Check for existing session and show warning
  useEffect(() => {
    if (session?.user && email && session.user.email !== email) {
      setShowSessionWarning(true);
    } else {
      setShowSessionWarning(false);
    }
  }, [session, email]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowSessionWarning(false);
    } catch (err) {
      setError("Failed to sign out. Please try again.");
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // If there's an existing session for a different user, sign out first
      if (session?.user && session.user.email !== email) {
        await signOut();
      }

      await signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      });

      setIsSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send magic link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (
    provider: "google" | "github" | "apple"
  ) => {
    try {
      await signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to sign in with ${provider}`
      );
    }
  };

  // Success state after sending magic link
  if (isSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a magic link to{" "}
              <span className="font-semibold">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-xs text-muted-foreground">
              Click the link in the email to sign in. The link expires in 15
              minutes.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSent(false);
                setEmail("");
              }}
            >
              Try another email
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Login form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Session conflict warning */}
          {showSessionWarning && session?.user && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-900 dark:text-amber-100">
                You're currently signed in as{" "}
                <span className="font-semibold">{session.user.email}</span>.
                <br />
                <Button
                  variant="link"
                  className="h-auto p-0 text-amber-900 dark:text-amber-100 underline"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>{" "}
                to continue with a different account.
              </AlertDescription>
            </Alert>
          )}

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send magic link
                </>
              )}
            </Button>
          </form>

          {/* Social Sign-In */}
          {(saasConfig.features.auth.social.google ||
            saasConfig.features.auth.social.github) && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                {saasConfig.features.auth.social.google && (
                  <Button
                    variant="outline"
                    onClick={() => handleSocialSignIn("google")}
                    className="w-full"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </Button>
                )}

                {saasConfig.features.auth.social.github && (
                  <Button
                    variant="outline"
                    onClick={() => handleSocialSignIn("github")}
                    className="w-full"
                  >
                    <Github className="h-5 w-5" />
                    Sign in with GitHub
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter>
          <p className="text-center text-xs text-muted-foreground w-full">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Redirect Message - Client Component
 *
 * Shows a friendly message and automatically redirects after a short delay.
 * This provides better UX than an instant redirect.
 */
export function RedirectMessage({ email }: { email: string }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect after 1.5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <CardTitle className="text-2xl">Already signed in</CardTitle>
          <CardDescription>
            You're currently signed in as{" "}
            <span className="font-semibold">{email}</span>
          </CardDescription>
          <CardDescription className="mt-2 text-sm">
            Redirecting to dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

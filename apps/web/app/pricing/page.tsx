import { auth } from "@/lib/auth";
import { PricingTable } from "@/components/pricing/pricing-table";
import { LandingHeader } from "@/components/layout/landing-header";
import { db, eq } from "@jetframe/db";
import { organizationBilling } from "@jetframe/db/schema/billing";

/**
 * Public Pricing Page
 *
 * Displays subscription plans for:
 * - Anonymous users (marketing page)
 * - Logged-in users (with current plan indication)
 *
 * Features:
 * - Monthly/yearly billing toggle
 * - Plan comparison cards
 * - Direct subscription checkout
 */
export default async function PricingPage() {
  const session = await auth();

  // Get current plan if user is logged in
  let currentPlanId = "free";
  if (session?.activeOrganizationId) {
    const billingRecord = await db.query.organizationBilling.findFirst({
      where: eq(organizationBilling.organizationId, session.activeOrganizationId),
    });
    currentPlanId = billingRecord?.planId || "free";
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
              </p>
            </div>

            {/* Pricing Table */}
            <PricingTable
              currentPlanId={currentPlanId}
              isLoggedIn={!!session}
            />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-muted-foreground">
                  Yes! You can upgrade, downgrade, or cancel your subscription at any time from your billing page. Changes take effect immediately.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  What are AI credits?
                </h3>
                <p className="text-muted-foreground">
                  AI credits are used for AI-powered features in the app. Each operation consumes a certain number of credits based on the AI model used. Pro and Enterprise plans include monthly credit grants.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Can I buy additional credits?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely! You can purchase credit packs at any time, even if you're on a paid subscription plan. Credits never expire.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards (Visa, Mastercard, American Express) through Stripe's secure payment processing.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-muted-foreground">
                  Our Free plan is available forever with no credit card required. You can explore core features before upgrading to a paid plan.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  What happens if I cancel?
                </h3>
                <p className="text-muted-foreground">
                  If you cancel your subscription, you'll retain access to paid features until the end of your billing period. Your unused credits will remain in your account.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users building amazing things with JetFrame.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href={session ? "/dashboard" : "/login"}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
              >
                {session ? "Go to Dashboard" : "Get Started Free"}
              </a>
              <a
                href="/billing"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
              >
                View All Features
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 JetFrame. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export const saasConfig = {
  // App Mode: B2C (personal workspaces) or B2B (teams)
  mode: "b2c" as "b2c" | "b2b",

  metadata: {
    name: "JetFrame",
    domain: "jetframe.io",
    description: "The SaaS Factory - Build B2B SaaS in 14-day sprints",
    logo: "/logo.svg",
  },

  // Feature Flags: Toggle entire domains safely
  features: {
    // Multi-tenancy: When false, users work in personal context (no teams UI)
    multiTenancy: false,

    auth: {
      social: {
        google: true,
        github: false,
        apple: false,
      },
      magicLink: true,
      twoFactor: false,
      passkey: false,
    },
    billing: {
      enabled: true,
      provider: "stripe" as const, // allows future switch to paddle, lemon_squeezy
      mode: "hybrid" as const, // subscription | credits | hybrid
    },
    email: {
      provider: "resend" as const, // allows future switch to sendgrid, postmark
    },
    storage: {
      enabled: true,
      provider: "r2" as const, // allows future switch to s3, gcs
    },
    // i18n removed for MVP - English only
    blog: true,
    aiGeneration: false,
    ai: {
      enabled: true,
      provider: "openai" as const, // allows future switch to anthropic, openrouter
      defaultModel: "gpt-4o-mini",
    },
    admin: {
      enabled: true,
      impersonation: true,
      emails: ["hasanoguz.developer@gmail.com"], // Add your admin emails here
    },
  },

  // Billing Configuration
  billing: {
    plans: {
      free: {
        id: "free",
        name: "Free",
        description: "Perfect for getting started",
        tier: 0, // Tier hierarchy for upgrade/downgrade detection
        priceMonthly: 0,
        priceYearly: 0,
        limits: {
          maxProjects: 3,
          maxMembers: 1,
          maxStorage: 100, // MB
        },
        features: ["3 Projects", "Basic Support", "100MB Storage"],
      },
      pro: {
        id: "pro",
        name: "Pro",
        description: "For professional teams",
        tier: 1, // Tier hierarchy for upgrade/downgrade detection
        priceMonthly: 29,
        priceYearly: 290, // ~$24/mo
        creditsPerMonth: 1000, // For hybrid mode
        stripePriceIdMonthly:
          process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "",
        stripePriceIdYearly:
          process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || "",
        limits: {
          maxProjects: 100,
          maxMembers: 10,
          maxStorage: 10000, // 10GB
        },
        features: [
          "100 Projects",
          "Priority Support",
          "10GB Storage",
          "1000 AI Credits/mo",
          "Advanced Analytics",
        ],
      },
      enterprise: {
        id: "enterprise",
        name: "Enterprise",
        description: "For large organizations",
        tier: 2, // Tier hierarchy for upgrade/downgrade detection
        priceMonthly: 99,
        priceYearly: 990,
        creditsPerMonth: 5000,
        stripePriceIdMonthly:
          process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || "",
        stripePriceIdYearly:
          process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY || "",
        limits: {
          maxProjects: -1, // Unlimited
          maxMembers: -1,
          maxStorage: -1,
        },
        features: [
          "Unlimited Projects",
          "24/7 Support",
          "Unlimited Storage",
          "5000 AI Credits/mo",
          "Custom Integrations",
          "Dedicated Account Manager",
        ],
      },
    },
    creditPacks: [
      {
        id: "starter",
        name: "Starter Pack",
        credits: 500,
        price: 10,
        stripePriceId:
          process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STARTER || "",
      },
      {
        id: "growth",
        name: "Growth Pack",
        credits: 1500,
        price: 25,
        stripePriceId:
          process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_GROWTH || "",
      },
      {
        id: "scale",
        name: "Scale Pack",
        credits: 5000,
        price: 75,
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_SCALE || "",
      },
    ],
  },

  // AI Configuration
  ai: {
    // Credit costs per model (how many credits are deducted per AI request)
    creditCosts: {
      "gpt-4o": 5,
      "gpt-4o-mini": 1,
      "gpt-4-turbo": 10,
      "gpt-3.5-turbo": 2,
      "claude-3-5-sonnet-20241022": 3,
      "claude-3-5-haiku-20241022": 1,
      default: 2,
    },
  },

  // Theme Configuration
  theme: {
    defaultTheme: "light" as const,
    themes: ["light", "dark"],
    colors: {
      primary: "blue",
      accent: "purple",
    },
  },

  // Email Configuration
  email: {
    from: {
      name: "JetFrame",
      address: "noreply@jetframe.io",
    },
    replyTo: "support@jetframe.io",
  },

  // Limits & Rate Limiting
  limits: {
    api: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
    },
    upload: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ],
    },
  },

  // Rate Limiting Configuration (Upstash Redis)
  rateLimits: {
    // GraphQL API endpoint
    graphql: {
      requests: 100,
      window: "1 m" as const, // 100 requests per minute
    },
    // AI operations (chat, generation, etc.)
    ai: {
      requests: 20,
      window: "1 m" as const, // 20 requests per minute (AI is expensive)
    },
    // Auth operations (login, signup, password reset)
    auth: {
      requests: 10,
      window: "1 m" as const, // 10 requests per minute (prevent brute force)
    },
  },
} as const;

// Export type for use in services
export type AppConfig = typeof saasConfig;
export type BillingPlan = keyof typeof saasConfig.billing.plans;
export type BillingMode = typeof saasConfig.features.billing.mode;

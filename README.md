# JetFrame - The SaaS Factory

> Build B2B SaaS applications in 14-day sprints. The indie hacker's complete SaaS boilerplate.

**Get started in 30 minutes** → [QuickStart Guide](./QUICKSTART.md)

## ✨ What's Included

JetFrame is a production-ready SaaS boilerplate with everything you need to launch fast:

### 🔐 Authentication & User Management
- ✅ Magic link email authentication (Better-Auth)
- ✅ Google OAuth ready
- ✅ Session management (Cookie + Bearer token)
- ✅ Multi-tenancy with organizations
- ✅ RBAC (Owner, Admin, Member roles)
- ✅ User profile management

### 💳 Billing & Payments
- ✅ Stripe integration (subscriptions + credits)
- ✅ 3 pre-configured plans (Free, Pro, Enterprise)
- ✅ Credit system for AI/usage-based features
- ✅ Buy credit packs
- ✅ Customer portal (manage subscriptions)
- ✅ Webhook handling (automated)
- ✅ Invoice generation

### 🎨 User Interface
- ✅ Beautiful landing page with pricing
- ✅ Responsive dashboard layout
- ✅ Billing management page
- ✅ Shadcn UI components
- ✅ Dark mode support
- ✅ Mobile-first design
- ✅ Notifications system with bell UI

### 🤖 AI Integration
- ✅ OpenAI SDK integration
- ✅ Credit tracking per request
- ✅ Streaming support
- ✅ Token counting
- ✅ Model-specific pricing

### 📊 Infrastructure
- ✅ PostgreSQL database (Drizzle ORM)
- ✅ Type-safe GraphQL API (Pothos + Yoga)
- ✅ React Query hooks (auto-generated)
- ✅ Email templates (React Email + Resend)
- ✅ File uploads (Cloudflare R2 ready)
- ✅ Error tracking (Sentry)
- ✅ Analytics (PostHog)
- ✅ Rate limiting (Upstash Redis)

### 🔔 Engagement Features
- ✅ In-app notification system
- ✅ Low credit warnings
- ✅ Email notifications
- ✅ Activity tracking

### 📱 Developer Experience
- ✅ TypeScript strict mode
- ✅ GraphQL code generation
- ✅ Database migrations (Drizzle)
- ✅ Hot reload
- ✅ Comprehensive documentation
- ✅ Testing checklist

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- npm 10+

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cd apps/web
   cp .env.example .env
   ```

   Update `.env` with your database URL and other credentials.

3. **Push database schema:**
   ```bash
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at:
   - **Web App:** http://localhost:3000
   - **GraphQL API:** http://localhost:3000/api/graphql (with GraphiQL in dev mode)

## 📁 Project Structure

```
jetframe/
├── apps/
│   └── web/                      # Next.js 16 App (App Router)
│       ├── app/                  # Routes & Pages
│       │   ├── (marketing)/      # Public pages
│       │   ├── (dashboard)/      # Authenticated app
│       │   └── api/graphql/      # GraphQL endpoint
│       ├── modules/              # Business logic by domain
│       │   ├── auth/            # Authentication
│       │   ├── billing/         # Payments & subscriptions
│       │   ├── config/          # Hybrid configuration
│       │   └── shared/          # Shared utilities & errors
│       ├── lib/                 # Infrastructure
│       │   ├── auth/            # Better-Auth setup
│       │   └── graphql/         # Pothos builder & context
│       ├── env.mjs              # Environment validation (t3-env)
│       └── saas.config.ts       # Feature flags & business config
├── packages/
│   ├── db/                      # Database layer
│   │   ├── schema/              # Drizzle schemas
│   │   │   ├── auth.ts         # Users, orgs, sessions
│   │   │   └── billing.ts      # Subscriptions, credits
│   │   ├── utils/              # Pagination helpers
│   │   └── index.ts            # DB connection
│   ├── ui/                     # Shared Shadcn components
│   ├── email/                  # React Email templates
│   ├── config/                 # Shared TS/ESLint configs
│   └── cli/                    # JetFrame CLI tool
└── turbo.json                  # Turborepo configuration
```

## 🏗️ Architecture

JetFrame follows a **Modular Monolith** pattern with strict domain separation:

### Core Principles

1. **Domain-Driven Design (Lite)**
   - Business logic organized by domain in `modules/[domain]/`
   - Each module owns its: API resolvers, services, components, GraphQL operations

2. **Organization-First Multi-Tenancy**
   - All data scoped to `organizationId` (not `userId`)
   - Built-in RBAC with roles: Owner, Admin, Member

3. **Configuration-Driven Development**
   - Static config: `saas.config.ts` (committed to code)
   - Dynamic overrides: Database (per-organization customization)
   - Merged via `getConfig(orgId)` service

4. **Type-Safe GraphQL API**
   - Code-first with Pothos (not SDL)
   - Zod validation plugin
   - Distributed schema (each module owns its types)

## 🛠️ Development Workflow

### Database Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Push schema to database (dev)
npm run db:push

# Open Drizzle Studio (visual DB editor)
npm run db:studio
```

### GraphQL Code Generation

```bash
# Generate React Query hooks from GraphQL operations
npm run graphql:generate

# Watch mode (auto-regenerate on file changes)
npm run graphql:watch
```

### Adding a New Feature

1. **Create the domain module:**
   ```
   apps/web/modules/projects/
   ├── api.ts                    # GraphQL resolvers
   ├── service.ts                # Business logic
   ├── components/               # UI components
   └── graphql/documents/        # Queries & mutations
   ```

2. **Define the database schema:**
   ```typescript
   // packages/db/schema/projects.ts
   export const projects = pgTable("projects", {
     id: uuid("id").primaryKey().defaultRandom(),
     organizationId: uuid("organization_id").notNull(),
     name: text("name").notNull(),
     // ...
   });
   ```

3. **Create GraphQL resolvers:**
   ```typescript
   // apps/web/modules/projects/api.ts
   import { builder } from '@/lib/graphql/builder';

   builder.queryField('projects', (t) =>
     t.field({
       type: [ProjectType],
       resolve: async (_, __, ctx) => {
         return projectService.list(ctx.session.activeOrganizationId);
       },
     })
   );
   ```

4. **Write GraphQL operations:**
   ```typescript
   // apps/web/modules/projects/graphql/documents/queries.ts
   export const GET_PROJECTS = gql`
     query GetProjects {
       projects { id name }
     }
   `;
   ```

5. **Use in components:**
   ```tsx
   import { useGetProjectsQuery } from '@/lib/graphql/generated';

   export function ProjectList() {
     const { data } = useGetProjectsQuery();
     return <div>{/* render projects */}</div>;
   }
   ```

## 📦 Tech Stack

| Layer         | Technology                     |
|---------------|--------------------------------|
| **Framework** | Next.js 16 (App Router)        |
| **Language**  | TypeScript (Strict)            |
| **Database**  | PostgreSQL + Drizzle ORM       |
| **Auth**      | Better-Auth                    |
| **API**       | GraphQL (Pothos + Yoga)        |
| **UI**        | Shadcn + Tailwind CSS          |
| **Data Fetch**| React Query + graphql-request  |
| **Validation**| Zod                            |
| **Monorepo**  | Turborepo                      |

## 🔐 Authentication

Supports both Cookie (web) and Bearer token (mobile) authentication:

```typescript
// Web client (automatic via httpOnly cookie)
const { data } = useGetProjectsQuery();

// Mobile/API client (Bearer token)
const client = getGraphQLClient(userToken);
const data = await client.request(GET_PROJECTS);
```

## 💳 Billing

Hybrid billing system supporting:
- **Subscription-only:** Traditional SaaS (e.g., $29/month)
- **Credits-only:** Pay-as-you-go (e.g., AI credits)
- **Hybrid:** Subscription + monthly credits (e.g., Pro plan with 1000 credits/month)

Configure in `saas.config.ts`:
```typescript
features: {
  billing: {
    mode: "hybrid", // subscription | credits | hybrid
  }
}
```

## 📚 Documentation

### Getting Started
- **[QuickStart Guide](./QUICKSTART.md)** - Get running in 30 minutes
- **[Battle Testing Checklist](./BATTLE_TESTING.md)** - Pre-launch testing guide
- **[AI Developer Guide](./CLAUDE.md)** - Working with Claude Code

### Architecture & Patterns
- **[Full Context](./OPUS_4.5_CONTEXT.md)** - Complete architecture overview
- **[Assessment](./JETFRAME_ASSESSMENT.md)** - Capabilities & gaps analysis

## 🎯 What to Build Next

JetFrame gives you the infrastructure. Now focus on what makes your product unique:

### Indie Hacker Approach
1. **Skip the boilerplate work** - Auth, billing, email all done ✅
2. **Use existing dashboards** - Stripe for subscriptions, PostHog for analytics, Sentry for errors
3. **Build your unique value** - The feature that solves your customer's problem
4. **Ship fast** - Launch in days, not months

### Your First Feature Module

Create your core domain logic:

```bash
# Example: Voice Notes SaaS
apps/web/modules/voice-notes/
├── api.ts              # GraphQL resolvers
├── service.ts          # Business logic
├── components/         # UI components
└── graphql/documents/  # Queries & mutations
```

See the architecture guide in [CLAUDE.md](./CLAUDE.md) for detailed patterns.

## 🚢 Ready to Launch?

Before deploying to production:

1. **Run the test checklist** → [BATTLE_TESTING.md](./BATTLE_TESTING.md)
2. **Set production env vars** - See [QUICKSTART.md](./QUICKSTART.md#step-2-set-up-environment-variables)
3. **Deploy to Vercel** - One-click deploy or use Vercel CLI
4. **Set up Stripe webhooks** - Point to your production domain
5. **Monitor with Sentry** - Track errors in real-time

**Remember**: Ship fast, iterate faster. Don't wait for perfection.

## 📝 Scripts Reference

```bash
npm run dev              # Start all apps in development
npm run build            # Build all apps for production
npm run lint             # Lint all packages
npm run format           # Format code with Prettier
npm run db:generate      # Generate database migration
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio
npm run graphql:generate # Generate GraphQL types & hooks
npm run jet              # Run JetFrame CLI
```

## 🤝 Contributing

This is an internal framework. For questions or issues, contact the core team.

## 📄 License

Proprietary - All Rights Reserved
# saas-starter-template

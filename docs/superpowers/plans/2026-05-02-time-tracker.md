# Time Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a personal time tracker on the existing JetFrame scaffold: Start/Stop a timer, see live progress vs an 8-hour daily goal, edit entries, and view daily/weekly/monthly totals.

**Architecture:** Two new domain modules (`time-tracking`, `user-settings`) following JetFrame's modular monolith pattern: Drizzle schema → service layer (org-scoped) → Pothos GraphQL resolvers → React Query hooks → UI under the existing `(app)` route group. One `time_entries` row per Start/Stop interval; a singleton `user_settings` row per user.

**Tech Stack:** Next.js 16 App Router, Drizzle + Postgres, Pothos GraphQL + graphql-yoga, Better-Auth, React Query (codegen-generated hooks), Tailwind + shadcn UI.

---

## Spec deviations from `docs/superpowers/specs/2026-05-02-time-tracker-design.md`

Two intentional deviations are baked into the tasks below:

1. **`timestamp` (without timezone), not `timestamptz`** — the existing JetFrame schema convention. We store UTC and bucket by user timezone in SQL via `AT TIME ZONE`. Postgres `timestamp without time zone` accepts UTC values fine.
2. **Auth gating uses the existing client-side check in [apps/web/app/(app)/layout.tsx](apps/web/app/(app)/layout.tsx), not a `proxy.ts` change.** Placing `/track` and `/settings/tracking` under the `(app)` route group inherits the layout's auth redirect — same as `/dashboard`, `/projects`, `/billing`. Spec §6 and §10.10 are obsolete on this point; no `proxy.ts` edit needed.

A third gotcha discovered during planning:

3. **Rate limiter throws on missing Upstash creds.** Every GraphQL request currently goes through `checkRateLimit()` which hard-fails without `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. **Task 0** adds a no-op fallback so personal-use deployments don't need an Upstash account.

---

## File structure

**New files:**
- `packages/db/schema/time_tracking.ts` — `timeEntries` and `userSettings` tables
- `apps/web/modules/time-tracking/types.ts` — inferred types
- `apps/web/modules/time-tracking/service.ts` — pure business logic
- `apps/web/modules/time-tracking/api.ts` — Pothos resolvers
- `apps/web/modules/time-tracking/graphql/documents/queries.ts`
- `apps/web/modules/time-tracking/graphql/documents/mutations.ts`
- `apps/web/modules/time-tracking/components/Timer.tsx`
- `apps/web/modules/time-tracking/components/GoalProgress.tsx`
- `apps/web/modules/time-tracking/components/EntryList.tsx`
- `apps/web/modules/time-tracking/components/EditEntryDialog.tsx`
- `apps/web/modules/time-tracking/components/PeriodTotals.tsx`
- `apps/web/modules/time-tracking/utils/format.ts` — duration/time formatters
- `apps/web/modules/user-settings/types.ts`
- `apps/web/modules/user-settings/service.ts`
- `apps/web/modules/user-settings/api.ts`
- `apps/web/modules/user-settings/graphql/documents/queries.ts`
- `apps/web/modules/user-settings/graphql/documents/mutations.ts`
- `apps/web/modules/user-settings/components/SettingsForm.tsx`
- `apps/web/modules/shared/middleware/rate-limit/noop.ts` — no-op provider
- `apps/web/app/(app)/track/page.tsx`
- `apps/web/app/(app)/settings/tracking/page.tsx`

**Modified files:**
- `apps/web/modules/shared/errors.ts` — 4 new error classes
- `apps/web/modules/shared/middleware/rate-limit/factory.ts` — fallback to no-op
- `packages/db/index.ts` — register new schema
- `packages/db/package.json` — add `./schema/time-tracking` export
- `packages/db/drizzle.config.ts` — add new schema path
- `apps/web/lib/graphql/schema.ts` — register module imports
- `apps/web/components/layout/main-nav.tsx` — add "Track" nav item

---

## Pre-flight checks

Before starting, verify the dev environment runs:

```bash
cd /Users/bussss/projects/time-tracker
npm run dev
```

The app must reach `http://localhost:3000` and the `/api/graphql` endpoint must serve GraphiQL in dev (status 200 on POST). If it doesn't, fix that before starting Task 0.

---

## Task 0: Rate-limit no-op fallback

Without this, every GraphQL request 500s when Upstash creds are missing.

**Files:**
- Create: `apps/web/modules/shared/middleware/rate-limit/noop.ts`
- Modify: `apps/web/modules/shared/middleware/rate-limit/factory.ts`

- [ ] **Step 1: Create the no-op provider**

`apps/web/modules/shared/middleware/rate-limit/noop.ts`:

```ts
import { IRateLimitProvider, RateLimitConfig, RateLimitResult } from "./interface";

/**
 * No-op rate limit provider. Used when Upstash creds aren't configured
 * (e.g. personal-use deployments). Allows every request.
 */
export class NoopRateLimitProvider implements IRateLimitProvider {
  async limit(_identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60_000,
    };
  }

  async reset(_identifier: string): Promise<void> {
    // no-op
  }
}
```

- [ ] **Step 2: Wire fallback into the factory**

Replace the body of `createRateLimitProvider` in `apps/web/modules/shared/middleware/rate-limit/factory.ts`:

```ts
import { IRateLimitProvider } from "./interface";
import { UpstashRateLimitProvider } from "./upstash";
import { NoopRateLimitProvider } from "./noop";
import { env } from "@/env.mjs";

let cachedProvider: IRateLimitProvider | null = null;

export function createRateLimitProvider(): IRateLimitProvider {
  if (cachedProvider) return cachedProvider;

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    cachedProvider = new UpstashRateLimitProvider();
  } else {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[rate-limit] Upstash creds missing — using NoopRateLimitProvider. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable real rate limiting."
      );
    }
    cachedProvider = new NoopRateLimitProvider();
  }

  return cachedProvider;
}

export function resetRateLimitProvider(): void {
  cachedProvider = null;
}
```

- [ ] **Step 3: Verify dev server still boots**

Restart `npm run dev`. Visit `http://localhost:3000/api/graphql`. Run a `{ health }` query in GraphiQL. Expected: `{ "data": { "health": "OK" } }` and the warning printed once in the terminal.

- [ ] **Step 4: Commit**

```bash
git add apps/web/modules/shared/middleware/rate-limit/
git commit -m "feat(rate-limit): add no-op fallback when Upstash creds missing

Every GraphQL request goes through checkRateLimit(). Without Upstash
creds the Upstash provider's constructor throws, breaking the API.
NoopRateLimitProvider lets personal-use deployments run without an
Upstash account."
```

---

## Task 1: Drizzle schema for time tracking

**Files:**
- Create: `packages/db/schema/time_tracking.ts`
- Modify: `packages/db/index.ts`
- Modify: `packages/db/package.json`
- Modify: `packages/db/drizzle.config.ts`

- [ ] **Step 1: Create the schema file**

`packages/db/schema/time_tracking.ts`:

```ts
import { pgTable, uuid, text, timestamp, integer, smallint, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Time Tracking Schema
 * - timeEntries: one row per Start/Stop interval. stop=null means running.
 * - userSettings: per-user singleton (PK = userId).
 *
 * FK constraints are NOT declared via .references() to avoid cross-package
 * type imports — they're added at the DB level in the migration SQL,
 * matching the existing convention in projects.ts/tasks.ts.
 */

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    start: timestamp("start").notNull(),
    stop: timestamp("stop"),
    description: text("description"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userStartIdx: index("idx_time_entries_user_start").on(table.userId, table.start.desc()),
    runningPerUser: uniqueIndex("uniq_time_entries_running_per_user")
      .on(table.userId)
      .where(sql`${table.stop} IS NULL`),
  })
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(480),
  weekStartsOn: smallint("week_starts_on").notNull().default(1),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Register schema in `packages/db/index.ts`**

Find the existing block of schema imports and add:

```ts
import * as timeTracking from "./schema/time_tracking";
```

Spread `...timeTracking` into the `schema:` object passed to `drizzle()`. Add a re-export line:

```ts
export * from "./schema/time_tracking";
```

The full set of edits to `packages/db/index.ts`:

```ts
// at the top with other schema imports:
import * as timeTracking from "./schema/time_tracking";

// inside drizzle({ schema: { ... } }):
//   ...notifications,
//   ...timeTracking,

// at the bottom with other re-exports:
export * from "./schema/time_tracking";
```

- [ ] **Step 3: Add subpath export in `packages/db/package.json`**

In the `"exports"` object, add:

```json
"./schema/time-tracking": "./schema/time_tracking.ts"
```

(Keep alphabetic-ish order with the existing entries.)

- [ ] **Step 4: Add schema path in `packages/db/drizzle.config.ts`**

Add `"./schema/time_tracking.ts"` to the `schema:` array. Final array:

```ts
schema: [
  "./schema/auth.ts",
  "./schema/billing.ts",
  "./schema/ai.ts",
  "./schema/time_tracking.ts",
  "../../apps/web/modules/projects/schema.ts",
  "../../apps/web/modules/tasks/schema.ts",
],
```

(The two `apps/web/modules/*/schema.ts` paths are pre-existing dead references — leave them as-is, not our problem.)

- [ ] **Step 5: Generate migration**

```bash
cd /Users/bussss/projects/time-tracker
npm run db:generate
```

Expected: a new file appears in `packages/db/drizzle/` named like `0004_<adjective>_<noun>.sql` containing `CREATE TABLE "time_entries"`, `CREATE TABLE "user_settings"`, the two indexes, and updates to `meta/_journal.json`.

- [ ] **Step 6: Inspect the generated SQL and add FK constraints**

Open the new migration file. After the `CREATE TABLE` statements but before any `CREATE INDEX`, append the FK constraints (Drizzle won't generate these because we omitted `.references()`):

```sql
ALTER TABLE "time_entries"
  ADD CONSTRAINT "time_entries_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "time_entries"
  ADD CONSTRAINT "time_entries_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

ALTER TABLE "user_settings"
  ADD CONSTRAINT "user_settings_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
```

- [ ] **Step 7: Apply the migration**

```bash
npm run db:push
```

Expected output ends with something like `[✓] Changes applied`. If `db:push` complains about destructive changes, abort and re-check Step 6 — we shouldn't be dropping anything.

- [ ] **Step 8: Verify tables and indexes exist**

```bash
cd /Users/bussss/projects/time-tracker/packages/db
npx tsx -e "
import { db } from './index';
import { sql } from 'drizzle-orm';
(async () => {
  const tables = await db.execute(sql\`SELECT tablename FROM pg_tables WHERE tablename IN ('time_entries','user_settings') ORDER BY tablename\`);
  console.log('tables:', tables);
  const idx = await db.execute(sql\`SELECT indexname FROM pg_indexes WHERE tablename = 'time_entries' ORDER BY indexname\`);
  console.log('time_entries indexes:', idx);
  process.exit(0);
})();
"
```

Expected: `time_entries` and `user_settings` listed; indexes include `idx_time_entries_user_start` and `uniq_time_entries_running_per_user`.

- [ ] **Step 9: Commit**

```bash
git add packages/db/schema/time_tracking.ts packages/db/index.ts packages/db/package.json packages/db/drizzle.config.ts packages/db/drizzle/
git commit -m "feat(db): add time_entries and user_settings tables

time_entries with partial unique index on (user_id) WHERE stop IS NULL
to enforce at most one running entry per user at the DB level."
```

---

## Task 2: Domain error classes

**Files:**
- Modify: `apps/web/modules/shared/errors.ts`

- [ ] **Step 1: Append new error classes**

Append to the end of `apps/web/modules/shared/errors.ts`:

```ts
/**
 * Time Tracking Errors
 */
export class AlreadyRunningError extends BaseError {
  runningEntryId: string;
  constructor(runningEntryId: string) {
    super("A timer is already running", "ALREADY_RUNNING");
    this.runningEntryId = runningEntryId;
  }
}

export class NoRunningTimerError extends BaseError {
  constructor() {
    super("No timer is currently running", "NO_RUNNING_TIMER");
  }
}

export class OverlapError extends BaseError {
  constructor(message: string = "Time entry overlaps with an existing entry") {
    super(message, "OVERLAP");
  }
}

export class InvalidTimeRangeError extends BaseError {
  constructor(message: string = "stop must be after start") {
    super(message, "INVALID_TIME_RANGE");
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/bussss/projects/time-tracker
npm run check-types
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/modules/shared/errors.ts
git commit -m "feat(errors): add time-tracking domain errors"
```

---

## Task 3: time-tracking types

**Files:**
- Create: `apps/web/modules/time-tracking/types.ts`

- [ ] **Step 1: Write the file**

```ts
import type { InferSelectModel, InferInsertModel } from "@jetframe/db";
import { timeEntries } from "@jetframe/db/schema/time-tracking";

export type TimeEntry = InferSelectModel<typeof timeEntries>;
export type NewTimeEntry = InferInsertModel<typeof timeEntries>;

export interface DailyTotal {
  date: string; // YYYY-MM-DD in user's tz
  totalMinutes: number;
}
```

- [ ] **Step 2: Type-check**

```bash
npm run check-types
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/modules/time-tracking/types.ts
git commit -m "feat(time-tracking): add inferred types"
```

---

## Task 4: time-tracking service — read paths

The service is pure functions taking `userId` and `organizationId`. No GraphQL imports. Built in two parts: reads first (Task 4), writes (Task 5), so each part is reviewable.

**Files:**
- Create: `apps/web/modules/time-tracking/service.ts`

- [ ] **Step 1: Initial service with read functions**

```ts
import { db, eq, and, sql, isNull, gte, lt, desc } from "@jetframe/db";
import { timeEntries } from "@jetframe/db/schema/time-tracking";
import type { TimeEntry, DailyTotal } from "./types";

/**
 * Get the user's currently-running entry, or null.
 * Relies on the partial unique index for correctness.
 */
export async function getCurrentEntry(
  userId: string,
  organizationId: string
): Promise<TimeEntry | null> {
  const rows = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.organizationId, organizationId),
        isNull(timeEntries.stop)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * List entries whose start falls in [from, to). Ordered start desc.
 */
export async function listEntries(
  userId: string,
  organizationId: string,
  from: Date,
  to: Date
): Promise<TimeEntry[]> {
  return db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.organizationId, organizationId),
        gte(timeEntries.start, from),
        lt(timeEntries.start, to)
      )
    )
    .orderBy(desc(timeEntries.start));
}

/**
 * Daily totals (in minutes) bucketed by the user's timezone.
 * Running entries contribute now() - start to today.
 */
export async function getDailyTotals(
  userId: string,
  organizationId: string,
  from: Date,
  to: Date,
  timezone: string
): Promise<DailyTotal[]> {
  const result = await db.execute(sql`
    SELECT
      to_char(date_trunc('day', "start" AT TIME ZONE ${timezone}), 'YYYY-MM-DD') AS date,
      SUM(EXTRACT(EPOCH FROM (COALESCE("stop", now()) - "start")) / 60)::int AS total_minutes
    FROM time_entries
    WHERE user_id = ${userId}
      AND organization_id = ${organizationId}
      AND "start" >= ${from}
      AND "start" <  ${to}
    GROUP BY 1
    ORDER BY 1
  `);

  // postgres-js returns rows as `result` array directly
  const rows = result as unknown as Array<{ date: string; total_minutes: number }>;
  return rows.map((r) => ({ date: r.date, totalMinutes: Number(r.total_minutes) }));
}
```

- [ ] **Step 2: Smoke-test the queries**

```bash
cd /Users/bussss/projects/time-tracker
npx tsx -e "
import { getCurrentEntry, listEntries, getDailyTotals } from './apps/web/modules/time-tracking/service';
(async () => {
  const fakeUser = '00000000-0000-0000-0000-000000000000';
  const fakeOrg = '00000000-0000-0000-0000-000000000000';
  console.log('current:', await getCurrentEntry(fakeUser, fakeOrg));
  console.log('list:', await listEntries(fakeUser, fakeOrg, new Date(0), new Date()));
  console.log('totals:', await getDailyTotals(fakeUser, fakeOrg, new Date(0), new Date(), 'UTC'));
  process.exit(0);
})();
"
```

Expected: each query returns `null` / `[]` without throwing.

- [ ] **Step 3: Commit**

```bash
git add apps/web/modules/time-tracking/service.ts
git commit -m "feat(time-tracking): service read paths"
```

---

## Task 5: time-tracking service — writes + overlap validation

**Files:**
- Modify: `apps/web/modules/time-tracking/service.ts`

- [ ] **Step 1: Append the helper and write functions**

Append to `apps/web/modules/time-tracking/service.ts`:

```ts
import { or, ne } from "@jetframe/db";
import {
  AlreadyRunningError,
  NoRunningTimerError,
  OverlapError,
  InvalidTimeRangeError,
  NotFoundError,
} from "@/modules/shared/errors";

/**
 * Throw OverlapError if the proposed [start, stop) interval overlaps any
 * other entry of the user. The currently-running entry counts as
 * [start, now()). `excludeId` skips the row being updated.
 */
async function assertNoOverlap(
  userId: string,
  organizationId: string,
  start: Date,
  stop: Date,
  excludeId: string | null
): Promise<void> {
  // Two intervals [a1,a2), [b1,b2) overlap iff a1 < b2 AND b1 < a2.
  // For DB rows, b2 = COALESCE(stop, now()).
  const conflicts = await db.execute(sql`
    SELECT id FROM time_entries
    WHERE user_id = ${userId}
      AND organization_id = ${organizationId}
      AND ${start} < COALESCE("stop", now())
      AND "start" < ${stop}
      ${excludeId ? sql`AND id <> ${excludeId}` : sql``}
    LIMIT 1
  `);
  const rows = conflicts as unknown as Array<{ id: string }>;
  if (rows.length > 0) {
    throw new OverlapError(`Overlaps existing entry ${rows[0].id}`);
  }
}

export async function startTimer(
  userId: string,
  organizationId: string,
  input: { description?: string | null; tags?: string[] }
): Promise<TimeEntry> {
  try {
    const [row] = await db
      .insert(timeEntries)
      .values({
        userId,
        organizationId,
        start: new Date(),
        stop: null,
        description: input.description ?? null,
        tags: input.tags ?? [],
      })
      .returning();
    return row;
  } catch (err: unknown) {
    // Unique violation on partial index → already running
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      const running = await getCurrentEntry(userId, organizationId);
      throw new AlreadyRunningError(running?.id ?? "unknown");
    }
    throw err;
  }
}

export async function stopTimer(
  userId: string,
  organizationId: string
): Promise<TimeEntry> {
  const running = await getCurrentEntry(userId, organizationId);
  if (!running) throw new NoRunningTimerError();

  const [row] = await db
    .update(timeEntries)
    .set({ stop: new Date(), updatedAt: new Date() })
    .where(eq(timeEntries.id, running.id))
    .returning();
  return row;
}

export async function createEntry(
  userId: string,
  organizationId: string,
  input: { start: Date; stop: Date; description?: string | null; tags?: string[] }
): Promise<TimeEntry> {
  if (input.stop <= input.start) throw new InvalidTimeRangeError();
  await assertNoOverlap(userId, organizationId, input.start, input.stop, null);

  const [row] = await db
    .insert(timeEntries)
    .values({
      userId,
      organizationId,
      start: input.start,
      stop: input.stop,
      description: input.description ?? null,
      tags: input.tags ?? [],
    })
    .returning();
  return row;
}

export async function updateEntry(
  userId: string,
  organizationId: string,
  id: string,
  patch: { start?: Date; stop?: Date; description?: string | null; tags?: string[] }
): Promise<TimeEntry> {
  const existing = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.id, id),
        eq(timeEntries.userId, userId),
        eq(timeEntries.organizationId, organizationId)
      )
    )
    .limit(1);
  if (existing.length === 0) throw new NotFoundError("Entry");
  const current = existing[0];

  // Disallow setting stop on a running entry via update — must use stopTimer.
  if (current.stop === null && patch.stop !== undefined) {
    throw new InvalidTimeRangeError(
      "Cannot set stop on a running entry — use stopTimer"
    );
  }

  const newStart = patch.start ?? current.start;
  const newStop = patch.stop ?? current.stop;

  if (newStop !== null && newStop <= newStart) {
    throw new InvalidTimeRangeError();
  }

  // Overlap check uses now() as the running entry's end if stop is null.
  const overlapEnd = newStop ?? new Date();
  await assertNoOverlap(userId, organizationId, newStart, overlapEnd, id);

  const updates: Partial<typeof current> = { updatedAt: new Date() };
  if (patch.start !== undefined) updates.start = patch.start;
  if (patch.stop !== undefined) updates.stop = patch.stop;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.tags !== undefined) updates.tags = patch.tags;

  const [row] = await db
    .update(timeEntries)
    .set(updates)
    .where(eq(timeEntries.id, id))
    .returning();
  return row;
}

export async function deleteEntry(
  userId: string,
  organizationId: string,
  id: string
): Promise<void> {
  const result = await db
    .delete(timeEntries)
    .where(
      and(
        eq(timeEntries.id, id),
        eq(timeEntries.userId, userId),
        eq(timeEntries.organizationId, organizationId)
      )
    )
    .returning();
  if (result.length === 0) throw new NotFoundError("Entry");
}
```

- [ ] **Step 2: Smoke-test against a real session**

This requires a logged-in user, so it's a dev-server check rather than a tsx one-liner. Skip if `npm run dev` isn't running. Otherwise leave for the integration test in Task 12.

- [ ] **Step 3: Type-check**

```bash
npm run check-types
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/modules/time-tracking/service.ts
git commit -m "feat(time-tracking): service writes + overlap validation"
```

---

## Task 6: time-tracking GraphQL resolvers

**Files:**
- Create: `apps/web/modules/time-tracking/api.ts`

- [ ] **Step 1: Write the resolvers**

```ts
import { builder } from "@/lib/graphql/builder";
import * as service from "./service";
import { NotAuthenticatedError } from "@/modules/shared/errors";
import type { TimeEntry, DailyTotal } from "./types";
import * as userSettingsService from "@/modules/user-settings/service";

const TimeEntryRef = builder
  .objectRef<TimeEntry>("TimeEntry")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      userId: t.exposeString("userId"),
      organizationId: t.exposeString("organizationId"),
      start: t.expose("start", { type: "DateTime" }),
      stop: t.expose("stop", { type: "DateTime", nullable: true }),
      description: t.exposeString("description", { nullable: true }),
      tags: t.exposeStringList("tags"),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

const DailyTotalRef = builder
  .objectRef<DailyTotal>("DailyTotal")
  .implement({
    fields: (t) => ({
      date: t.exposeString("date"),
      totalMinutes: t.exposeInt("totalMinutes"),
    }),
  });

const StartTimerInput = builder.inputType("StartTimerInput", {
  fields: (t) => ({
    description: t.string({ required: false }),
    tags: t.stringList({ required: false }),
  }),
});

const CreateEntryInput = builder.inputType("CreateEntryInput", {
  fields: (t) => ({
    start: t.field({ type: "DateTime", required: true }),
    stop: t.field({ type: "DateTime", required: true }),
    description: t.string({ required: false }),
    tags: t.stringList({ required: false }),
  }),
});

const UpdateEntryInput = builder.inputType("UpdateEntryInput", {
  fields: (t) => ({
    start: t.field({ type: "DateTime", required: false }),
    stop: t.field({ type: "DateTime", required: false }),
    description: t.string({ required: false }),
    tags: t.stringList({ required: false }),
  }),
});

// Queries

builder.queryField("currentEntry", (t) =>
  t.field({
    type: TimeEntryRef,
    nullable: true,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.getCurrentEntry(ctx.session.userId, ctx.session.activeOrganizationId);
    },
  })
);

builder.queryField("entries", (t) =>
  t.field({
    type: [TimeEntryRef],
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.listEntries(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.from,
        args.to
      );
    },
  })
);

builder.queryField("dailyTotals", (t) =>
  t.field({
    type: [DailyTotalRef],
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const settings = await userSettingsService.getOrCreateUserSettings(ctx.session.userId);
      return service.getDailyTotals(
        ctx.session.userId,
        ctx.session.activeOrganizationId,
        args.from,
        args.to,
        settings.timezone
      );
    },
  })
);

// Mutations

builder.mutationField("startTimer", (t) =>
  t.field({
    type: TimeEntryRef,
    args: {
      input: t.arg({ type: StartTimerInput, required: false }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.startTimer(ctx.session.userId, ctx.session.activeOrganizationId, {
        description: args.input?.description ?? null,
        tags: args.input?.tags ?? [],
      });
    },
  })
);

builder.mutationField("stopTimer", (t) =>
  t.field({
    type: TimeEntryRef,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.stopTimer(ctx.session.userId, ctx.session.activeOrganizationId);
    },
  })
);

builder.mutationField("createEntry", (t) =>
  t.field({
    type: TimeEntryRef,
    args: {
      input: t.arg({ type: CreateEntryInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.createEntry(ctx.session.userId, ctx.session.activeOrganizationId, {
        start: args.input.start,
        stop: args.input.stop,
        description: args.input.description ?? null,
        tags: args.input.tags ?? [],
      });
    },
  })
);

builder.mutationField("updateEntry", (t) =>
  t.field({
    type: TimeEntryRef,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateEntryInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      const patch: {
        start?: Date;
        stop?: Date;
        description?: string | null;
        tags?: string[];
      } = {};
      if (args.input.start !== undefined && args.input.start !== null) patch.start = args.input.start;
      if (args.input.stop !== undefined && args.input.stop !== null) patch.stop = args.input.stop;
      if (args.input.description !== undefined) patch.description = args.input.description;
      if (args.input.tags !== undefined && args.input.tags !== null) patch.tags = args.input.tags;
      return service.updateEntry(ctx.session.userId, ctx.session.activeOrganizationId, args.id, patch);
    },
  })
);

builder.mutationField("deleteEntry", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      await service.deleteEntry(ctx.session.userId, ctx.session.activeOrganizationId, args.id);
      return true;
    },
  })
);
```

- [ ] **Step 2: Don't register yet — defer to Task 9 along with user-settings module to keep schema imports atomic.**

- [ ] **Step 3: Type-check**

```bash
npm run check-types
```

Expected: PASS *with* errors about missing `@/modules/user-settings/service` — that's wired up in Task 7. Skip the check until Task 7's Step 1 is done, OR comment out the `userSettingsService` import + the `dailyTotals` resolver body temporarily. Cleanest: do Task 7 first, then come back here and verify. **Reorder note:** if you want strict TDD, swap Task 6 and Task 7. Either order works.

- [ ] **Step 4: Commit (after Task 7 lands and types pass)**

```bash
git add apps/web/modules/time-tracking/api.ts
git commit -m "feat(time-tracking): GraphQL resolvers"
```

---

## Task 7: user-settings module (types + service + resolvers)

**Files:**
- Create: `apps/web/modules/user-settings/types.ts`
- Create: `apps/web/modules/user-settings/service.ts`
- Create: `apps/web/modules/user-settings/api.ts`

- [ ] **Step 1: Types**

`apps/web/modules/user-settings/types.ts`:

```ts
import type { InferSelectModel } from "@jetframe/db";
import { userSettings } from "@jetframe/db/schema/time-tracking";

export type UserSettings = InferSelectModel<typeof userSettings>;
```

- [ ] **Step 2: Service**

`apps/web/modules/user-settings/service.ts`:

```ts
import { db, eq } from "@jetframe/db";
import { userSettings } from "@jetframe/db/schema/time-tracking";
import type { UserSettings } from "./types";
import { ValidationError } from "@/modules/shared/errors";

export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  if (existing.length > 0) return existing[0];

  const [row] = await db
    .insert(userSettings)
    .values({ userId })
    .returning();
  return row;
}

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function updateUserSettings(
  userId: string,
  patch: { dailyGoalMinutes?: number; weekStartsOn?: number; timezone?: string }
): Promise<UserSettings> {
  // Ensure row exists
  await getOrCreateUserSettings(userId);

  if (patch.dailyGoalMinutes !== undefined) {
    if (patch.dailyGoalMinutes <= 0 || patch.dailyGoalMinutes > 24 * 60) {
      throw new ValidationError("dailyGoalMinutes must be between 1 and 1440");
    }
  }
  if (patch.weekStartsOn !== undefined) {
    if (patch.weekStartsOn !== 0 && patch.weekStartsOn !== 1) {
      throw new ValidationError("weekStartsOn must be 0 (Sun) or 1 (Mon)");
    }
  }
  if (patch.timezone !== undefined && !isValidTimezone(patch.timezone)) {
    throw new ValidationError(`Invalid IANA timezone: ${patch.timezone}`);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.dailyGoalMinutes !== undefined) updates.dailyGoalMinutes = patch.dailyGoalMinutes;
  if (patch.weekStartsOn !== undefined) updates.weekStartsOn = patch.weekStartsOn;
  if (patch.timezone !== undefined) updates.timezone = patch.timezone;

  const [row] = await db
    .update(userSettings)
    .set(updates)
    .where(eq(userSettings.userId, userId))
    .returning();
  return row;
}
```

- [ ] **Step 3: API**

`apps/web/modules/user-settings/api.ts`:

```ts
import { builder } from "@/lib/graphql/builder";
import * as service from "./service";
import { NotAuthenticatedError } from "@/modules/shared/errors";
import type { UserSettings } from "./types";

const UserSettingsRef = builder
  .objectRef<UserSettings>("UserSettings")
  .implement({
    fields: (t) => ({
      userId: t.exposeString("userId"),
      dailyGoalMinutes: t.exposeInt("dailyGoalMinutes"),
      weekStartsOn: t.exposeInt("weekStartsOn"),
      timezone: t.exposeString("timezone"),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

const UpdateUserSettingsInput = builder.inputType("UpdateUserSettingsInput", {
  fields: (t) => ({
    dailyGoalMinutes: t.int({ required: false }),
    weekStartsOn: t.int({ required: false }),
    timezone: t.string({ required: false }),
  }),
});

builder.queryField("userSettings", (t) =>
  t.field({
    type: UserSettingsRef,
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.getOrCreateUserSettings(ctx.session.userId);
    },
  })
);

builder.mutationField("updateUserSettings", (t) =>
  t.field({
    type: UserSettingsRef,
    args: {
      input: t.arg({ type: UpdateUserSettingsInput, required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return service.updateUserSettings(ctx.session.userId, {
        dailyGoalMinutes: args.input.dailyGoalMinutes ?? undefined,
        weekStartsOn: args.input.weekStartsOn ?? undefined,
        timezone: args.input.timezone ?? undefined,
      });
    },
  })
);
```

- [ ] **Step 4: Type-check (combined with Task 6 now)**

```bash
npm run check-types
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/modules/user-settings/ apps/web/modules/time-tracking/api.ts
git commit -m "feat(user-settings): types, service, GraphQL

Pairs with time-tracking/api.ts which depends on getOrCreateUserSettings."
```

---

## Task 8: GraphQL operation documents

**Files:**
- Create: `apps/web/modules/time-tracking/graphql/documents/queries.ts`
- Create: `apps/web/modules/time-tracking/graphql/documents/mutations.ts`
- Create: `apps/web/modules/user-settings/graphql/documents/queries.ts`
- Create: `apps/web/modules/user-settings/graphql/documents/mutations.ts`

- [ ] **Step 1: time-tracking queries**

`apps/web/modules/time-tracking/graphql/documents/queries.ts`:

```ts
import { gql } from "graphql-request";

export const TIME_ENTRY_FIELDS = gql`
  fragment TimeEntryFields on TimeEntry {
    id
    start
    stop
    description
    tags
    createdAt
    updatedAt
  }
`;

export const GET_CURRENT_ENTRY = gql`
  query GetCurrentEntry {
    currentEntry {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const GET_ENTRIES = gql`
  query GetEntries($from: DateTime!, $to: DateTime!) {
    entries(from: $from, to: $to) {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const GET_DAILY_TOTALS = gql`
  query GetDailyTotals($from: DateTime!, $to: DateTime!) {
    dailyTotals(from: $from, to: $to) {
      date
      totalMinutes
    }
  }
`;
```

- [ ] **Step 2: time-tracking mutations**

`apps/web/modules/time-tracking/graphql/documents/mutations.ts`:

```ts
import { gql } from "graphql-request";
import { TIME_ENTRY_FIELDS } from "./queries";

export const START_TIMER = gql`
  mutation StartTimer($input: StartTimerInput) {
    startTimer(input: $input) {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const STOP_TIMER = gql`
  mutation StopTimer {
    stopTimer {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const CREATE_ENTRY = gql`
  mutation CreateEntry($input: CreateEntryInput!) {
    createEntry(input: $input) {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const UPDATE_ENTRY = gql`
  mutation UpdateEntry($id: String!, $input: UpdateEntryInput!) {
    updateEntry(id: $id, input: $input) {
      ...TimeEntryFields
    }
  }
  ${TIME_ENTRY_FIELDS}
`;

export const DELETE_ENTRY = gql`
  mutation DeleteEntry($id: String!) {
    deleteEntry(id: $id)
  }
`;
```

- [ ] **Step 3: user-settings queries**

`apps/web/modules/user-settings/graphql/documents/queries.ts`:

```ts
import { gql } from "graphql-request";

export const USER_SETTINGS_FIELDS = gql`
  fragment UserSettingsFields on UserSettings {
    userId
    dailyGoalMinutes
    weekStartsOn
    timezone
  }
`;

export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    userSettings {
      ...UserSettingsFields
    }
  }
  ${USER_SETTINGS_FIELDS}
`;
```

- [ ] **Step 4: user-settings mutations**

`apps/web/modules/user-settings/graphql/documents/mutations.ts`:

```ts
import { gql } from "graphql-request";
import { USER_SETTINGS_FIELDS } from "./queries";

export const UPDATE_USER_SETTINGS = gql`
  mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
    updateUserSettings(input: $input) {
      ...UserSettingsFields
    }
  }
  ${USER_SETTINGS_FIELDS}
`;
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/modules/time-tracking/graphql/ apps/web/modules/user-settings/graphql/
git commit -m "feat: GraphQL operation documents for time-tracking + user-settings"
```

---

## Task 9: Register modules + run codegen

**Files:**
- Modify: `apps/web/lib/graphql/schema.ts`

- [ ] **Step 1: Add side-effect imports**

Open `apps/web/lib/graphql/schema.ts`. After the existing module imports and before `export const schema = builder.toSchema();`, add:

```ts
import "@/modules/user-settings/api";
import "@/modules/time-tracking/api";
```

- [ ] **Step 2: Restart dev server**

In the terminal running `npm run dev`, Ctrl-C and restart. Watch for type errors. Visit `http://localhost:3000/api/graphql` and run:

```graphql
{ __type(name: "TimeEntry") { fields { name type { name kind ofType { name } } } } }
```

Expected: returns the TimeEntry fields including `start`, `stop`, `tags`.

- [ ] **Step 3: Run codegen**

In a second terminal (dev server must be running):

```bash
cd /Users/bussss/projects/time-tracker
npm run graphql:generate
```

Expected: `apps/web/lib/graphql/generated.ts` gets regenerated. Check `git diff apps/web/lib/graphql/generated.ts` and confirm new exports `useGetCurrentEntryQuery`, `useStartTimerMutation`, `useGetUserSettingsQuery`, etc. are present.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/graphql/schema.ts apps/web/lib/graphql/generated.ts
git commit -m "feat: register time-tracking + user-settings, regen GraphQL hooks"
```

---

## Task 10: Format utilities

**Files:**
- Create: `apps/web/modules/time-tracking/utils/format.ts`

- [ ] **Step 1: Write the helpers**

```ts
/**
 * Format a duration in minutes as "Xh Ym" (or "Xm" if < 60).
 * Negative values are clamped to 0.
 */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

/**
 * Format milliseconds as "HH:MM:SS" (live timer display).
 */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Format a Date as "HH:MM" in the given IANA timezone.
 */
export function formatTimeOfDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

/**
 * Compute today's [from, to) range in the user's timezone, as UTC Dates
 * suitable for SQL params.
 */
export function todayRange(timezone: string): { from: Date; to: Date } {
  const now = new Date();
  // Get today's date components in the user's tz
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  // Midnight in user's tz, expressed as a UTC instant
  const localMidnight = new Date(`${y}-${m}-${d}T00:00:00`);
  // Adjust by the offset between local-as-if-UTC and the actual tz
  const offsetMinutes = getTimezoneOffsetMinutes(localMidnight, timezone);
  const from = new Date(localMidnight.getTime() - offsetMinutes * 60_000);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

/**
 * Range for the current week, anchored to weekStartsOn (0=Sun, 1=Mon).
 */
export function weekRange(timezone: string, weekStartsOn: 0 | 1): { from: Date; to: Date } {
  const { from: todayFrom } = todayRange(timezone);
  const dayOfWeek = todayFrom.getUTCDay(); // 0=Sun..6=Sat in UTC; close enough since todayFrom is local-midnight-as-UTC
  const diff = (dayOfWeek - weekStartsOn + 7) % 7;
  const from = new Date(todayFrom.getTime() - diff * 24 * 60 * 60 * 1000);
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from, to };
}

/**
 * Range for the current month in the user's tz.
 */
export function monthRange(timezone: string): { from: Date; to: Date } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const firstLocal = new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00`);
  const offsetMinutes = getTimezoneOffsetMinutes(firstLocal, timezone);
  const from = new Date(firstLocal.getTime() - offsetMinutes * 60_000);
  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const nextFirstLocal = new Date(
    `${nextMonth.y}-${String(nextMonth.m).padStart(2, "0")}-01T00:00:00`
  );
  const nextOffset = getTimezoneOffsetMinutes(nextFirstLocal, timezone);
  const to = new Date(nextFirstLocal.getTime() - nextOffset * 60_000);
  return { from, to };
}

function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  const tzString = date.toLocaleString("en-US", { timeZone: timezone });
  const utcString = date.toLocaleString("en-US", { timeZone: "UTC" });
  return (new Date(utcString).getTime() - new Date(tzString).getTime()) / 60_000;
}
```

- [ ] **Step 2: Type-check**

```bash
npm run check-types
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/modules/time-tracking/utils/
git commit -m "feat(time-tracking): formatting and range helpers"
```

---

## Task 11: UI components

**Files:**
- Create: `apps/web/modules/time-tracking/components/Timer.tsx`
- Create: `apps/web/modules/time-tracking/components/GoalProgress.tsx`
- Create: `apps/web/modules/time-tracking/components/EntryList.tsx`
- Create: `apps/web/modules/time-tracking/components/EditEntryDialog.tsx`
- Create: `apps/web/modules/time-tracking/components/PeriodTotals.tsx`

- [ ] **Step 1: Timer**

`apps/web/modules/time-tracking/components/Timer.tsx`:

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Square } from "lucide-react";
import {
  useGetCurrentEntryQuery,
  useStartTimerMutation,
  useStopTimerMutation,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { formatElapsed } from "../utils/format";
import { toast } from "sonner";

export function Timer() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetCurrentEntryQuery();
  const running = data?.currentEntry ?? null;

  const [description, setDescription] = useState("");
  useEffect(() => {
    setDescription(running?.description ?? "");
  }, [running?.id]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running?.id]);

  const elapsed = useMemo(() => {
    if (!running) return 0;
    return now - new Date(running.start).getTime();
  }, [running?.id, now]);

  const start = useStartTimerMutation({
    onSuccess: () => {
      qc.invalidateQueries();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to start");
    },
  });
  const stop = useStopTimerMutation({
    onSuccess: () => {
      qc.invalidateQueries();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to stop");
    },
  });

  if (isLoading) return <div className="h-12 animate-pulse rounded bg-muted" />;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      {running ? (
        <Button
          size="lg"
          variant="destructive"
          onClick={() => stop.mutate({})}
          disabled={stop.isPending}
        >
          <Square className="mr-2 h-4 w-4" /> Stop
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={() => start.mutate({ input: { description: description || null } })}
          disabled={start.isPending}
        >
          <Play className="mr-2 h-4 w-4" /> Start
        </Button>
      )}

      <Input
        placeholder="What are you working on?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="flex-1"
      />

      {running && (
        <div className="font-mono text-2xl tabular-nums">{formatElapsed(elapsed)}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: GoalProgress**

`apps/web/modules/time-tracking/components/GoalProgress.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  useGetDailyTotalsQuery,
  useGetUserSettingsQuery,
  useGetCurrentEntryQuery,
} from "@/lib/graphql/generated";
import { todayRange } from "../utils/format";
import { formatMinutes } from "../utils/format";

export function GoalProgress() {
  const { data: settingsData } = useGetUserSettingsQuery();
  const tz = settingsData?.userSettings.timezone ?? "UTC";
  const goal = settingsData?.userSettings.dailyGoalMinutes ?? 480;

  const { from, to } = todayRange(tz);
  const { data } = useGetDailyTotalsQuery({ from, to });
  const { data: currentData } = useGetCurrentEntryQuery();

  // server-side total (accurate as of last fetch)
  const baseMinutes = data?.dailyTotals[0]?.totalMinutes ?? 0;

  // add live ticking for the running entry so the bar moves between fetches
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!currentData?.currentEntry) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [currentData?.currentEntry?.id]);

  // if there's a running entry, the server total already counts now() - start
  // at fetch time. we approximate continued progress by adding the seconds
  // since fetch — close enough; refetch on every minute via the 30s tick.
  const liveMinutes = baseMinutes;

  const pct = Math.min(100, Math.round((liveMinutes / goal) * 100));
  const over = liveMinutes - goal;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Today</span>
        <span className="font-mono text-sm">
          {formatMinutes(liveMinutes)} / {formatMinutes(goal)}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-secondary">
        <div
          className={over >= 0 ? "h-full bg-green-500 transition-all" : "h-full bg-primary transition-all"}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over > 0 && (
        <div className="mt-1 text-xs text-green-600">+{formatMinutes(over)} over goal</div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: EditEntryDialog**

`apps/web/modules/time-tracking/components/EditEntryDialog.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useCreateEntryMutation,
  useUpdateEntryMutation,
  TimeEntryFieldsFragment,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimeEntryFieldsFragment | null; // null/undefined = create mode
}

function toLocalInput(d: Date): string {
  // datetime-local format: YYYY-MM-DDTHH:MM
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditEntryDialog({ open, onOpenChange, entry }: Props) {
  const qc = useQueryClient();
  const isEdit = !!entry;
  const isRunning = isEdit && entry?.stop == null;

  const [start, setStart] = useState("");
  const [stop, setStop] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (entry) {
      setStart(toLocalInput(new Date(entry.start)));
      setStop(entry.stop ? toLocalInput(new Date(entry.stop)) : "");
      setDescription(entry.description ?? "");
    } else {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60_000);
      setStart(toLocalInput(oneHourAgo));
      setStop(toLocalInput(now));
      setDescription("");
    }
  }, [entry?.id, open]);

  const create = useCreateEntryMutation({
    onSuccess: () => { qc.invalidateQueries(); onOpenChange(false); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const update = useUpdateEntryMutation({
    onSuccess: () => { qc.invalidateQueries(); onOpenChange(false); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const submit = () => {
    const startDate = new Date(start);
    if (isEdit && entry) {
      const patch: { start?: Date; stop?: Date; description: string | null } = {
        start: startDate,
        description: description || null,
      };
      if (!isRunning && stop) patch.stop = new Date(stop);
      update.mutate({ id: entry.id, input: patch });
    } else {
      if (!stop) {
        toast.error("Stop time is required for manual entries");
        return;
      }
      create.mutate({
        input: { start: startDate, stop: new Date(stop), description: description || null },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit entry" : "Add entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start">Start</Label>
            <Input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stop">{isRunning ? "Stop (running — use Stop button)" : "Stop"}</Label>
            <Input
              id="stop"
              type="datetime-local"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: EntryList**

`apps/web/modules/time-tracking/components/EntryList.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  useGetEntriesQuery,
  useGetUserSettingsQuery,
  useDeleteEntryMutation,
  TimeEntryFieldsFragment,
} from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { todayRange, formatTimeOfDay, formatMinutes } from "../utils/format";
import { EditEntryDialog } from "./EditEntryDialog";
import { toast } from "sonner";

export function EntryList() {
  const qc = useQueryClient();
  const { data: settingsData } = useGetUserSettingsQuery();
  const tz = settingsData?.userSettings.timezone ?? "UTC";
  const { from, to } = todayRange(tz);
  const { data, isLoading } = useGetEntriesQuery({ from, to });

  const [editing, setEditing] = useState<TimeEntryFieldsFragment | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const del = useDeleteEntryMutation({
    onSuccess: () => { qc.invalidateQueries(); setPendingDelete(null); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-sm font-semibold">Today's entries</h2>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add entry
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2 p-4">
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-8 animate-pulse rounded bg-muted" />
        </div>
      ) : data?.entries.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No entries yet today.</div>
      ) : (
        <ul className="divide-y">
          {data?.entries.map((e) => {
            const startMs = new Date(e.start).getTime();
            const stopMs = e.stop ? new Date(e.stop).getTime() : Date.now();
            const minutes = Math.round((stopMs - startMs) / 60_000);
            const running = e.stop == null;
            return (
              <li key={e.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatTimeOfDay(new Date(e.start), tz)} → {running ? "now" : formatTimeOfDay(new Date(e.stop!), tz)}
                </span>
                <span className="font-mono w-16 tabular-nums">{formatMinutes(minutes)}</span>
                <span className="flex-1 truncate">
                  {e.description || <span className="text-muted-foreground">—</span>}
                </span>
                <Button size="icon" variant="ghost" onClick={() => setEditing(e)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {!running && (
                  <Button size="icon" variant="ghost" onClick={() => setPendingDelete(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <EditEntryDialog
        open={!!editing || creating}
        onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}
        entry={editing}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && del.mutate({ id: pendingDelete })}
              disabled={del.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 5: PeriodTotals**

`apps/web/modules/time-tracking/components/PeriodTotals.tsx`:

```tsx
"use client";

import { useGetDailyTotalsQuery, useGetUserSettingsQuery } from "@/lib/graphql/generated";
import { weekRange, monthRange, formatMinutes } from "../utils/format";

export function PeriodTotals() {
  const { data: settingsData } = useGetUserSettingsQuery();
  const tz = settingsData?.userSettings.timezone ?? "UTC";
  const weekStartsOn = (settingsData?.userSettings.weekStartsOn ?? 1) as 0 | 1;

  const week = weekRange(tz, weekStartsOn);
  const month = monthRange(tz);

  const { data: weekData } = useGetDailyTotalsQuery({ from: week.from, to: week.to });
  const { data: monthData } = useGetDailyTotalsQuery({ from: month.from, to: month.to });

  const sum = (rows: { totalMinutes: number }[] | undefined) =>
    rows?.reduce((acc, r) => acc + r.totalMinutes, 0) ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs text-muted-foreground">This week</div>
        <div className="mt-1 text-2xl font-semibold">{formatMinutes(sum(weekData?.dailyTotals))}</div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs text-muted-foreground">This month</div>
        <div className="mt-1 text-2xl font-semibold">{formatMinutes(sum(monthData?.dailyTotals))}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Type-check**

```bash
npm run check-types
```

Expected: PASS. If errors mention missing `TimeEntryFieldsFragment`, the codegen output didn't pick up the fragment — re-run `npm run graphql:generate` and retry.

- [ ] **Step 7: Commit**

```bash
git add apps/web/modules/time-tracking/components/
git commit -m "feat(time-tracking): UI components"
```

---

## Task 12: /track page + nav link

**Files:**
- Create: `apps/web/app/(app)/track/page.tsx`
- Modify: `apps/web/components/layout/main-nav.tsx`

- [ ] **Step 1: Page**

`apps/web/app/(app)/track/page.tsx`:

```tsx
"use client";

import { Timer } from "@/modules/time-tracking/components/Timer";
import { GoalProgress } from "@/modules/time-tracking/components/GoalProgress";
import { EntryList } from "@/modules/time-tracking/components/EntryList";
import { PeriodTotals } from "@/modules/time-tracking/components/PeriodTotals";

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Track</h1>
      <Timer />
      <GoalProgress />
      <EntryList />
      <PeriodTotals />
    </div>
  );
}
```

- [ ] **Step 2: Add nav item**

In `apps/web/components/layout/main-nav.tsx`, edit the `navItems` array. Add a Clock icon import and an entry for Track placed after Dashboard:

```ts
import { LayoutDashboard, Clock, FolderKanban, CreditCard, Settings } from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Track",
    href: "/track",
    icon: Clock,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
```

- [ ] **Step 3: Browser smoke test**

With `npm run dev` running, log in (use the magic link printed to your terminal in dev) and visit `http://localhost:3000/track`. Verify:
- Page loads without console errors.
- "Start" button works → entry appears in list with elapsed counter.
- "Stop" button works → entry shows duration.
- "Add entry" dialog creates a manual entry.
- Pencil edits an entry.
- Trash deletes a non-running entry.
- "Today" progress bar updates.
- "This week" / "This month" totals are non-zero after an entry exists.

If anything fails, fix before moving on.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(app\)/track/page.tsx apps/web/components/layout/main-nav.tsx
git commit -m "feat: /track page and nav link"
```

---

## Task 13: Settings page

**Files:**
- Create: `apps/web/modules/user-settings/components/SettingsForm.tsx`
- Create: `apps/web/app/(app)/settings/tracking/page.tsx`

- [ ] **Step 1: SettingsForm**

`apps/web/modules/user-settings/components/SettingsForm.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useGetUserSettingsQuery, useUpdateUserSettingsMutation } from "@/lib/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Istanbul", "Asia/Tokyo"];

export function SettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetUserSettingsQuery();

  const [goal, setGoal] = useState(480);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    if (data?.userSettings) {
      setGoal(data.userSettings.dailyGoalMinutes);
      setWeekStartsOn((data.userSettings.weekStartsOn as 0 | 1));
      setTimezone(data.userSettings.timezone);
    }
  }, [data?.userSettings]);

  const update = useUpdateUserSettingsMutation({
    onSuccess: () => { qc.invalidateQueries(); toast.success("Settings saved"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded bg-muted" />;

  return (
    <form
      className="max-w-md space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate({ input: { dailyGoalMinutes: goal, weekStartsOn, timezone } });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="goal">Daily goal (minutes)</Label>
        <Input
          id="goal"
          type="number"
          min={1}
          max={1440}
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">{Math.floor(goal / 60)}h {goal % 60}m</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="week">Week starts on</Label>
        <select
          id="week"
          className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={weekStartsOn}
          onChange={(e) => setWeekStartsOn(Number(e.target.value) as 0 | 1)}
        >
          <option value={0}>Sunday</option>
          <option value={1}>Monday</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tz">Timezone</Label>
        <select
          id="tz"
          className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={update.isPending}>Save</Button>
    </form>
  );
}
```

- [ ] **Step 2: Page**

`apps/web/app/(app)/settings/tracking/page.tsx`:

```tsx
"use client";

import { SettingsForm } from "@/modules/user-settings/components/SettingsForm";

export default function TrackingSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Tracking settings</h1>
      <SettingsForm />
    </div>
  );
}
```

- [ ] **Step 3: Smoke test**

Visit `http://localhost:3000/settings/tracking` while logged in. Change goal to e.g. 240, save, refresh, confirm value persists. Visit `/track` and confirm goal bar shows `… / 4h`. Change back to 480.

- [ ] **Step 4: Commit**

```bash
git add apps/web/modules/user-settings/components/ apps/web/app/\(app\)/settings/tracking/
git commit -m "feat: /settings/tracking page"
```

---

## Task 14: End-to-end smoke test

No code; verification only.

- [ ] **Step 1: Run all type checks and the build**

```bash
cd /Users/bussss/projects/time-tracker
npm run check-types
npm run lint
npm run build
```

All must pass.

- [ ] **Step 2: Manual flow with two timer cycles**

1. Log out, log back in.
2. `/track`: hit Start, type a description.
3. Verify elapsed counter ticks every second.
4. Hit Stop.
5. Hit Start again (no description).
6. Wait 5 seconds, hit Stop.
7. Verify both entries appear in list.
8. Edit the second entry's description. Save. Confirm list updates.
9. Click Add entry, set start = 1 hour ago and stop = 30 minutes ago, save. Confirm it appears with correct duration.
10. Try to add another entry overlapping the previous one — confirm an `OVERLAP` error toast appears.
11. Delete a finished entry. Confirm it's gone.
12. Confirm "This week" total roughly matches the sum of today's entries (assuming no prior days).

- [ ] **Step 3: No commit**

End of plan. The work is done.

---

## Deferred from spec (intentional)

- **>12h "forgot to stop" banner** (spec §8). Pure polish. Easy to add later as a check inside `Timer.tsx`: if `elapsed > 12h`, show an inline prompt with two buttons calling `updateEntry` with computed stop times. Not blocking v1.

## Self-review notes (kept for transparency)

Issues caught during the self-review pass and fixed inline:

1. Spec said `proxy.ts` needed updating for `/track` and `/settings`. Auditing the codebase showed `(app)/layout.tsx` already auth-gates client-side; the plan documents this and skips the proxy edit.
2. Spec used `timestamptz`. Existing schemas use `timestamp` without time zone. Plan keeps the existing convention and notes the deviation up front.
3. Discovered the rate-limit hard-fail problem during planning. Added Task 0 to fix it before any GraphQL work.
4. Codegen requires the dev server running; called this out at Task 9 Step 3 explicitly.
5. Drizzle's `.references()` is intentionally not used (cross-package import issue) — Task 1 Step 6 manually appends FK SQL to the generated migration to match the existing pattern in `projects.ts`/`tasks.ts`.

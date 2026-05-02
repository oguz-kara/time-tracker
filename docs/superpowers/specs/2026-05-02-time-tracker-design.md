# Time Tracker — Design

**Date:** 2026-05-02
**Status:** Approved for implementation planning
**Audience:** Single user initially (the author); multi-user supported via existing JetFrame auth scaffold so teammates can be added later without redesign.

## 1. Purpose

Track personal working hours against a daily goal (default 8 hours). The author works from home alongside a full-time job and frequently steps away for meals, errands, etc. Pressing Start/Stop around real work intervals — plus seeing live progress toward the daily goal — makes it visible whether 8 hours actually got worked.

Daily, weekly, and monthly totals are the primary output. Per-project or per-task breakdowns are explicitly out of scope.

## 2. Scope

### In scope (v1)

- Start / Stop a single running timer.
- Free-text description per entry.
- Optional tags per entry (`text[]`, no separate tags table).
- Manual create / edit / delete of entries (to fix forgotten starts/stops).
- Daily goal in minutes (user-configurable, default 480 = 8h) with a live progress bar.
- Daily, weekly, monthly totals.
- Per-user timezone and week-start day for correct day bucketing.

### Explicitly out of scope (deferred)

Pomodoro, break timers, projects, tasks, billable flag, hourly rate, invoicing, CSV/PDF export, charts, idle detection, screenshot tracking, reminders/notifications, time-off / holiday tracking, mobile-specific UI, multi-org switcher.

## 3. Data model

Two new tables in [packages/db/schema/time_tracking.ts](../../../packages/db/schema/time_tracking.ts) (new file). Wire into [packages/db/index.ts](../../../packages/db/index.ts) and the `exports` map of [packages/db/package.json](../../../packages/db/package.json) per the existing convention.

### `time_entries`

| Column           | Type           | Notes                                                                          |
|------------------|----------------|--------------------------------------------------------------------------------|
| `id`             | `uuid` PK      | `defaultRandom()`                                                              |
| `userId`         | `text`         | FK → `users.id` ON DELETE CASCADE                                              |
| `organizationId` | `uuid`         | FK → `organizations.id` ON DELETE CASCADE — JetFrame multi-tenancy convention  |
| `start`          | `timestamptz`  | `not null`                                                                     |
| `stop`           | `timestamptz`  | nullable; `null` = currently running                                           |
| `description`    | `text`         | nullable                                                                       |
| `tags`           | `text[]`       | `not null default '{}'`                                                        |
| `createdAt`      | `timestamptz`  | `default now()`                                                                |
| `updatedAt`      | `timestamptz`  | `default now()`                                                                |

**Indexes:**

- `idx_time_entries_user_start` on `(userId, start desc)` — primary read pattern (recent entries for a user).
- Partial unique index `uniq_time_entries_running_per_user` on `(userId)` `WHERE stop IS NULL` — DB-level guarantee that at most one running entry exists per user. Cheaper and more correct than an app-level check; eliminates the double-Start race.

**Why org-scoped:** every JetFrame domain query filters by `ctx.session.activeOrganizationId`. We follow the same pattern even though `multiTenancy` is currently `false` (B2C), because `activeOrganizationId` resolves to the user's personal org and we want the multi-user upgrade path to be free.

### `user_settings`

| Column              | Type           | Notes                                              |
|---------------------|----------------|----------------------------------------------------|
| `userId`            | `text` PK      | FK → `users.id` ON DELETE CASCADE                  |
| `dailyGoalMinutes`  | `integer`      | `not null default 480` (8h)                        |
| `weekStartsOn`      | `smallint`     | `not null default 1` (0=Sun, 1=Mon)                |
| `timezone`          | `text`         | `not null default 'UTC'` (IANA, e.g. `Europe/Istanbul`) |
| `createdAt`         | `timestamptz`  | `default now()`                                    |
| `updatedAt`         | `timestamptz`  | `default now()`                                    |

Auto-created with defaults on first read of `userSettings` so the row's existence is never something the UI has to handle.

## 4. Module structure

Two new modules under [apps/web/modules/](../../../apps/web/modules/), each following the canonical JetFrame layout:

```
modules/time-tracking/
  api.ts                       # Pothos resolvers (thin)
  service.ts                   # business logic, no GraphQL imports
  types.ts                     # InferSelectModel/InferInsertModel from schema
  components/
    Timer.tsx                  # Start/Stop button + live elapsed counter
    GoalProgress.tsx           # progress bar vs dailyGoalMinutes
    EntryList.tsx              # today's entries with edit/delete
    EditEntryDialog.tsx        # create + edit shared dialog
    PeriodTotals.tsx           # week/month stat cards
  graphql/documents/
    queries.ts
    mutations.ts

modules/user-settings/
  api.ts
  service.ts
  types.ts
  components/
    SettingsForm.tsx           # dailyGoalMinutes, weekStartsOn, timezone
  graphql/documents/
    queries.ts
    mutations.ts
```

Both register in [apps/web/lib/graphql/schema.ts](../../../apps/web/lib/graphql/schema.ts) by adding side-effect imports after the existing module list.

Resolvers stay thin: auth check (`if (!ctx.session) throw new NotAuthenticatedError()`), then delegate to service. Services accept `userId` and `organizationId` as explicit arguments and never read `ctx`.

## 5. GraphQL surface

### Queries

| Field                                                | Returns                            | Notes                                                                                  |
|------------------------------------------------------|------------------------------------|----------------------------------------------------------------------------------------|
| `currentEntry`                                       | `TimeEntry` (nullable)             | The user's running entry, or null. One DB lookup on the partial unique index.          |
| `entries(from: DateTime!, to: DateTime!)`            | `[TimeEntry!]!`                    | Entries whose `start` falls in `[from, to)`. Ordered by `start desc`.                  |
| `dailyTotals(from: DateTime!, to: DateTime!)`        | `[DailyTotal!]!`                   | One row per day in range as `{ date: Date, totalMinutes: Int }`. Computed in SQL.      |
| `userSettings`                                       | `UserSettings!`                    | Auto-creates row with defaults if missing.                                             |

`dailyTotals` SQL sketch:

```sql
SELECT
  date_trunc('day', start AT TIME ZONE $tz)::date AS date,
  SUM(EXTRACT(EPOCH FROM (COALESCE(stop, now()) - start)) / 60)::int AS total_minutes
FROM time_entries
WHERE user_id = $userId
  AND organization_id = $orgId
  AND start >= $from
  AND start <  $to
GROUP BY 1
ORDER BY 1;
```

Running entries contribute `now() - start` to today's total. The client doesn't need to do this math.

### Mutations

| Field                                                                | Returns       | Behavior                                                                                                                              |
|----------------------------------------------------------------------|---------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `startTimer(input: StartTimerInput)`                                 | `TimeEntry!`  | Inserts row with `start = now()`, `stop = null`. Unique-index violation → `AlreadyRunningError` with the running entry's id.          |
| `stopTimer`                                                          | `TimeEntry!`  | Sets `stop = now()` on the running entry. `NoRunningTimerError` if none.                                                              |
| `createEntry(input: CreateEntryInput!)`                              | `TimeEntry!`  | Manual entry. Validates `stop > start` and no overlap (see §7).                                                                       |
| `updateEntry(id: ID!, input: UpdateEntryInput!)`                     | `TimeEntry!`  | Patch start/stop/description/tags. Same overlap validation. Editing the running entry is allowed for description/tags/start only.    |
| `deleteEntry(id: ID!)`                                               | `Boolean!`    |                                                                                                                                       |
| `updateUserSettings(input: UpdateUserSettingsInput!)`                | `UserSettings!` | Patch any subset of `dailyGoalMinutes`, `weekStartsOn`, `timezone`.                                                                   |

`StartTimerInput`: `{ description?: String, tags?: [String!] }`.
`CreateEntryInput`: `{ start: DateTime!, stop: DateTime!, description?: String, tags?: [String!] }`.
`UpdateEntryInput`: `{ start?: DateTime, stop?: DateTime, description?: String, tags?: [String!] }`.
`UpdateUserSettingsInput`: `{ dailyGoalMinutes?: Int, weekStartsOn?: Int, timezone?: String }`.

All errors extend `BaseError` from [apps/web/modules/shared/errors.ts](../../../apps/web/modules/shared/errors.ts). New error classes added there: `AlreadyRunningError`, `NoRunningTimerError`, `OverlapError`, `InvalidTimeRangeError`.

## 6. UI

One primary page at `/track` under the `(app)` route group. Auth gating is in [apps/web/proxy.ts](../../../apps/web/proxy.ts) — its `matcher` already covers everything non-static, but its in-body check only redirects unauthenticated users for paths starting with `/dashboard`. Extend that check (not the matcher) to also redirect for `/track` and `/settings`.

### `/track` layout

```
┌──────────────────────────────────────────────────────┐
│  [ START ▶ ]   description: __________________       │   ← Timer
│              when running: shows "01:23:45" live      │
├──────────────────────────────────────────────────────┤
│  Today: 5h 23m / 8h                                  │   ← GoalProgress
│  ████████████████████░░░░░░░░  67%                   │
├──────────────────────────────────────────────────────┤
│  Today's entries                            + Add    │   ← EntryList
│  ─────────────────────────────────────────────────   │
│   09:00 → 11:30   2h 30m   "deep work on X"   ✎ ✕   │
│   12:00 → 13:00   1h 00m   "meeting"          ✎ ✕   │
│   14:00 → now     1h 53m   "focus block"      ✎      │ (running, no delete)
├──────────────────────────────────────────────────────┤
│  This week: 32h 15m       This month: 142h 08m       │   ← PeriodTotals
└──────────────────────────────────────────────────────┘
```

- Live elapsed counter is `setInterval(1000)` on the client; no server polling. The "tick" only updates a derived display value — `currentEntry` is not refetched every second.
- When today's total exceeds the goal, the bar turns green and shows `+1h 12m over goal`.
- "Add entry" opens `EditEntryDialog` in create mode. Pencil icon opens it in edit mode.
- Delete is a confirm dialog (alert-dialog from `@radix-ui/react-alert-dialog`, already in deps).

### `/settings/tracking`

Plain form: daily goal (number input, minutes), week starts on (Sun/Mon dropdown), timezone (searchable select of IANA zones — use `Intl.supportedValuesOf('timeZone')`, no extra dep).

## 7. Validation rules

- **`stop > start`** for any entry where `stop` is set.
- **No overlap.** A new or updated entry must not overlap any other entry of the same user. Two intervals `[a1, a2)` and `[b1, b2)` overlap iff `a1 < b2 AND b1 < a2`. The currently running entry counts as `[start, now())` for this check. Implemented as a single SQL `WHERE` against `time_entries` filtered by `userId` and excluding the row being updated.
- **`dailyGoalMinutes`** must be `> 0` and `<= 24 * 60`.
- **`weekStartsOn`** must be `0` or `1` (Sun or Mon — only options exposed in v1).
- **`timezone`** must be a valid IANA name; validate via `Intl.DateTimeFormat(undefined, { timeZone: x })` not throwing.

Validation errors throw `ValidationError` (existing) or the specific overlap/range errors from §5.

## 8. Edge cases

| Case                                                                  | Behavior                                                                                                                                            |
|-----------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| Two devices, both hit Start                                           | DB unique index throws → `AlreadyRunningError` carrying the running entry's id; client invalidates `currentEntry` and refetches.                    |
| Closed laptop, forgot to stop, comes back next day (running > 12h)    | UI shows a banner with two suggested stop times: (a) the previous entry's `stop` for the same user (or `start + 8h` if no prior entry exists today), and (b) `now`. User picks one or enters a custom value. Never auto-stops silently. |
| Editing running entry's `stop`                                        | Disallowed in v1 (you stop it via Stop, then edit). Editing description/tags/start is allowed.                                                      |
| Editing `start` of running entry                                      | Allowed only if new start is in the past and doesn't create an overlap.                                                                              |
| Server clock vs client clock                                          | All "now" comes from the server (`now()` in SQL). Client never sends timestamps for Start/Stop — only for manual create/edit.                       |
| DST transition during an entry                                        | `timestamptz` storage handles wall-clock vs UTC correctly. Display in user's tz.                                                                    |
| Day boundary mid-entry (started 23:30, stopped 01:15)                 | Entry is bucketed into the day its `start` falls on (matches Toggl/Clockify behavior). Documented in the UI tooltip on the totals.                  |
| Entry with empty description                                          | Allowed. Renders as a muted "—".                                                                                                                    |

## 9. Constraints from the existing codebase

- **Drizzle operators** must be imported from `@jetframe/db`, not `drizzle-orm` (single-instance rule — see [packages/db/index.ts](../../../packages/db/index.ts)).
- **GraphQL codegen requires the dev server running.** Document this in the implementation plan: `npm run dev` in one terminal, then `npm run graphql:generate` after editing operations.
- **All thrown errors extend `BaseError`.** New error classes go in [apps/web/modules/shared/errors.ts](../../../apps/web/modules/shared/errors.ts).
- **`transpilePackages`** doesn't need updating — we add no new workspace packages.
- **Auth context already supplies `session.userId` and `session.activeOrganizationId`** — no auth work needed.

## 10. Build sequence (high-level — detailed plan to follow in writing-plans)

1. Drizzle schema + migration + db index/exports wiring.
2. New error classes in `modules/shared/errors.ts`.
3. `modules/time-tracking/` service (pure functions, the overlap-validation helper) + tests if a runner is wired up; otherwise unit-callable.
4. `modules/time-tracking/` GraphQL types + resolvers.
5. `modules/user-settings/` service + GraphQL.
6. Register both modules in `lib/graphql/schema.ts`. Run `graphql:generate`.
7. UI: `/track` page wiring `Timer`, `GoalProgress`, `EntryList`, `PeriodTotals`.
8. UI: `EditEntryDialog` (create + edit modes).
9. UI: `/settings/tracking` page.
10. Extend `proxy.ts` auth-redirect logic to gate `/track` and `/settings`.
11. Manual smoke test against the actual UI per the JetFrame "test in a browser before claiming done" rule.

## 11. Open questions

None at design time. All blocking decisions resolved.

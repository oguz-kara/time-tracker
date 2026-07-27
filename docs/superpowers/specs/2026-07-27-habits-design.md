# Habits Module — Design Spec

**Date:** 2026-07-27
**Status:** Approved for planning

## Overview

A habit-management module inside DenTracker, inspired by Atomic Habits, run with a lightweight Scrum metaphor. The user keeps a **backlog** of good habits (do X, daily or N×/week) and bad habits (avoid Y), commits a small set of them to a **sprint** (1–4 weeks), checks in daily via a ~5-second **Today checklist**, and closes each sprint with a **retro** deciding each habit's fate. Sprints are *commitment windows*, not completion goals: habits that stick **graduate to "established"** (still tracked daily, no longer occupying a sprint slot); habits that are too hard can be dropped or shrunk mid-sprint without ceremony.

### Goals

- Daily interaction ≤ 5 seconds: open Today, tap checkboxes, done.
- Sprint mechanics that provide a WIP limit, a prioritization moment, and a review cadence.
- Agility as a first-class feature: dropping/swapping a habit mid-sprint is normal, not a failure state.
- Continuity: established habits keep streaks between sprints; the app is useful with no active sprint.

### Non-goals (v1)

See "Out of scope" at the end.

## Architecture

New module `apps/web/modules/habits/`, scaffolded with `pnpm jet make:module habits`, following the canonical module shape used by `time-tracking`:

```
modules/habits/
  service.ts                    # business logic, Drizzle queries, (userId, organizationId)-scoped
  api.ts                        # Pothos objectRefs + queryField/mutationField, thin
  types.ts                      # InferSelectModel + DTOs + enums
  graphql/documents/queries.ts  # gql docs → codegen → React Query hooks
  graphql/documents/mutations.ts
  components/*.tsx              # "use client", consume generated hooks
  utils/*.ts                    # pure scoring/streak helpers (unit-tested)
```

- Auto-registered in `apps/web/lib/graphql/schema.ts` and the db package by the generator; verify wiring in **both** `packages/db/schema/index.ts` and `packages/db/index.ts` (time_tracking is only exported from the latter).
- All queries scoped `(userId, organizationId)` from the GraphQL context, same as time-tracking.
- Navigation: one entry in `primaryNav` (`components/layout/main-nav.tsx`) after History — `{ titleKey: "habits", href: "/habits", icon: ListChecks }` — plus `nav.habits` and a `habits.*` namespace in `messages/en.json` and `messages/tr.json`.
- Reuse from time-tracking: date-key convention from `utils/format.ts` (tz-aware `en-CA` YYYY-MM-DD), `useUserTimezone`, calendar/date components, shadcn/ui primitives. Small shared helpers may be imported from `modules/time-tracking/utils` directly; lift into `modules/shared` only if an import feels wrong during implementation.
- No mock-data layer in v1 (skip the `USE_MOCK_*` convention).

## Data model

New file `packages/db/schema/habits.ts` (FKs added in migration SQL, not `.references()`, per repo convention). Four tables:

### `habits`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | text | |
| organization_id | uuid | |
| name | text | required |
| type | text | `'good'` \| `'bad'` |
| frequency | text | `'daily'` \| `'weekly'`; only meaningful for good habits. Bad habits are implicitly "avoid every day" (store `'daily'`). |
| times_per_week | int, nullable | required when frequency = `'weekly'` (1–7) |
| status | text | `'backlog'` \| `'in_sprint'` \| `'established'` \| `'dropped'` |
| position | int, default 0 | backlog ordering (edited via dialog; no drag-drop in v1) |
| intention | text, nullable | "I will [habit] at [time] in [location]" — shown as cue on the checklist |
| starter | text, nullable | 2-minute version — surfaced when a habit is struggling |
| identity | text, nullable | "I am a reader" — shown on habit card |
| notes | text, nullable | |
| created_at / updated_at | timestamptz | |

Index: `(user_id, status)`.

### `sprints`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | text | |
| organization_id | uuid | |
| name | text | default "Sprint N" (N = count of user's sprints + 1), editable |
| starts_on | date | |
| ends_on | date | derived from length choice (1/2/3/4 weeks) at creation, stored as date |
| status | text | `'active'` \| `'completed'` |
| retro_notes | text, nullable | filled at retro |
| created_at | timestamptz | |

**Partial unique index on `(user_id)` where `status = 'active'`** — one active sprint per user (same trick as the one-running-timer index on `time_entries`).

### `sprint_habits`

| Column | Type | Notes |
|---|---|---|
| sprint_id | uuid | composite PK with habit_id |
| habit_id | uuid | |
| outcome | text, nullable | null while active; `'graduated'` \| `'carried'` \| `'returned'` \| `'dropped'` |
| completion_pct | int, nullable | snapshot stored when outcome is set |

Mid-sprint removal sets `outcome = 'dropped'` and `completion_pct` immediately.

### `habit_checks`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | text | |
| organization_id | uuid | |
| habit_id | uuid | |
| date | date | the user-timezone local date (`en-CA` YYYY-MM-DD keying) |
| kind | text | `'done'` (good habits) \| `'slip'` (bad habits) |
| count | int, default 1 | slips increment ("slipped 3×"); always 1 for `'done'` |
| created_at | timestamptz | |

**Unique index `(habit_id, date)`.** Un-checking a good habit deletes the row. `undoSlip` decrements count, deleting the row at 0.

## GraphQL API

Enums: `HabitType`, `HabitFrequency`, `HabitStatus`, `SprintStatus`, `SprintOutcome`, `CheckKind`.

**Queries**

- `habits(status: HabitStatus)` — list for backlog/management views, ordered by `position`.
- `dailyChecklist(date: String!)` — drives Today: habits due that date (in-sprint + established), each with check state, streak, weekly-progress (n/N), and needs-attention flag.
- `activeSprint` — sprint + member habits + per-habit and overall progress; null if none.
- `completedSprints` — history list with stored outcomes/completion snapshots.

**Mutations**

- `createHabit(input)` / `updateHabit(id, input)` — input covers name, type, frequency, timesPerWeek, position, intention, starter, identity, notes.
- `dropHabit(id)` — soft delete: status → `'dropped'`; checks and sprint history preserved.
- `startSprint(lengthWeeks: Int!, habitIds: [ID!]!, name: String)` — sets member habits to `'in_sprint'`. Fails via shared error types if an active sprint exists (index-backed).
- `addHabitToSprint(habitId)` / `removeHabitFromSprint(habitId)` — mid-sprint swap/drop on the active sprint; removal records `outcome: 'dropped'` + completion snapshot, habit status → `'backlog'`.
- `toggleCheck(habitId, date)` — good habits; idempotent upsert/delete.
- `logSlip(habitId, date)` / `undoSlip(habitId, date)` — bad habits; increments/decrements `count`.
- `completeRetro(sprintId, decisions: [{habitId, outcome}]!, retroNotes: String)` — validates every non-dropped member has a decision, snapshots `completion_pct`, applies status transitions, sets sprint `'completed'`.

Service functions in `service.ts` mirror these 1:1; resolvers in `api.ts` stay thin.

## Screens

All under `/habits` with thin route shells (`app/(app)/habits/…/page.tsx` renders one module component; `layout.tsx` holds metadata only), matching the `track`/`history` pattern.

### Today — `/habits`

The daily surface.

- Sprint strip on top: "Day 6 of 14 · 71%" (hidden if no active sprint; a "Plan a sprint" CTA shows instead). If the sprint is past `ends_on`, the strip becomes a "Sprint ended — run your retro" nag linking to the sprint page.
- Good habits due today: checkbox rows; `intention` as subtitle (the cue); weekly habits show a "2/3 this week" chip and appear every day until quota is met, then render as satisfied for the rest of the week.
- Bad habits (in-sprint + established): days-clean counter + a visually quiet "slipped" button (tapping again increments; undo available).
- Established habits render in the same list, badged subtly; a **needs-attention** badge appears per the decay rules below, with the habit's `starter` text offered as the suggested shrink.
- Backfill: a small date stepper (reuse `DateField` pattern) allows checking past dates. Future dates are never checkable.

### Backlog — `/habits/backlog`

- Ordered list (by `position`) of backlog habits; established and dropped habits visible under collapsed sections.
- Add/edit dialog: name, type, frequency (+ times/week), the three book fields, notes, position.
- Drop action (soft delete).

### Sprint — `/habits/sprint`

Three states:

1. **Active sprint:** per-habit progress bars (completion % so far), days remaining, drop (with confirm) and "swap in from backlog" actions.
2. **No active sprint:** planning screen — pick length (1/2/3/4 weeks, starting today), select habits from backlog; habits whose most recent outcome was `'carried'` come pre-checked; a soft, non-blocking warning appears when selecting more than 4 habits ("start small").
3. **Sprint past `ends_on`:** retro flow — per-habit completion %, outcome picker (graduate / carry / return to backlog / drop), sprint-level retro notes, then an optional "start next sprint now" that jumps to planning with carried habits pre-checked.

Past sprints listed below (name, dates, overall %, per-habit outcomes).

## Business rules

**Day boundary.** A "day" is the local date in `user_settings.timezone`, keyed `en-CA` YYYY-MM-DD — identical to time-tracking's convention.

**Streaks.**
- Daily good habit: consecutive checked days ending today or yesterday (an unchecked *today* doesn't break the streak until the day is over; an unchecked yesterday does).
- Weekly good habit: consecutive weeks meeting quota (weeks per `user_settings.week_starts_on`). The current week counts toward the streak once its quota is met; until then it displays as n/N progress without breaking the streak.
- Bad habit: days since last slip. If never slipped, days since tracking started (the `starts_on` of the earliest sprint containing the habit).

**Sprint scoring.** Window is `starts_on`..`ends_on` inclusive; checks outside the window never affect sprint score (but do count toward streaks).
- Daily good habit: checked days ÷ elapsed window days.
- Weekly good habit: checks ÷ prorated expectation (`times_per_week` per completed week + `times_per_week × elapsed_days_in_partial_week / 7`), capped at 100%.
- Bad habit: clean days ÷ elapsed window days (a day with any slip is not clean).
- Overall sprint % = unweighted mean across member habits (dropped members excluded from the live view, included with their snapshot in history).

**Sprint lifecycle.** Sprint stays `'active'` past `ends_on` until the retro is completed; daily checking continues meanwhile. Retro outcomes apply: `graduated` → status `'established'`; `carried` → status `'backlog'` (pre-checked at next planning); `returned` → `'backlog'`; `dropped` → `'dropped'`.

**Needs-attention (established decay).**
- Daily good habit: no check in the last 3 days.
- Weekly good habit: previous week's quota missed.
- Bad habit: 2+ slips in the last 7 days.
The badge is informational; the remedy is manual (pull it back into a sprint, shrink via `starter`, or drop).

## Edge cases & error handling

- Starting a sprint while one is active: rejected by the partial unique index; surfaced via the shared GraphQL error types with a friendly message.
- `toggleCheck` on a `'bad'` habit or `logSlip` on a `'good'` habit: validation error.
- Checks/slips on habits whose status is `'backlog'` or `'dropped'`: validation error — only `'in_sprint'` and `'established'` habits are checkable.
- Checks for future dates: validation error. Past dates: allowed (backfill), any date.
- `completeRetro` with missing/duplicate decisions or on a non-active sprint: validation error.
- Adding a habit to a sprint when its status isn't `'backlog'`: validation error.
- Deleting habits is always soft (`'dropped'`); history and checks are preserved. No hard delete in v1.
- Weekly habit edited mid-sprint (e.g., 3×→5×): scoring uses the current value retroactively — accepted simplification, noted in UI copy ("changing frequency recalculates progress").

## Testing

- All scoring/streak/proration logic implemented as pure functions in `modules/habits/utils/` operating on plain data (no db access), with unit tests: streak boundaries (today/yesterday), week-start handling, proration math, clean-day counting, timezone date keying.
- Resolvers/components follow the same manual-verification approach as the existing time-tracking module; no new test infrastructure beyond a runner for the utils (add vitest scoped to the web app if none exists when implementation starts).

## Out of scope (v1)

- Auto-completing habits from time entries (e.g., an entry tagged `reading` ≥ 20min checks the habit) — the flagship v2 feature.
- Calendar heatmaps, per-habit charts, sprint history charts, dashboard widget.
- Reminders/notifications.
- Habit stacking mechanics (anchoring habits to other habits).
- Drag-and-drop backlog reordering.
- Multi-user/team features (module stays `(userId, organizationId)`-scoped like everything else).

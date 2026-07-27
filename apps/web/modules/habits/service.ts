import { db, eq, and, sql, inArray, gte, lte, desc, asc } from "@jetframe/db";
import { habits, sprints, sprintHabits, habitChecks } from "@jetframe/db/schema/habits";
import type {
  Habit,
  Sprint,
  ChecklistItem,
  ActiveSprintView,
  CompletedSprintView,
  SprintMemberProgress,
  BacklogPlanningHabit,
} from "./types";
import { HABIT_TYPES, HABIT_FREQUENCIES, HABIT_STATUSES, SPRINT_OUTCOMES } from "./types";
import {
  NotFoundError,
  ValidationError,
  InvalidHabitStateError,
  HabitNotCheckableError,
  SprintAlreadyActiveError,
  NoActiveSprintError,
} from "@/modules/shared/errors";
import { todayKey, addDays, diffDays, dateKeyInTz } from "./utils/dates";
import {
  completionPct,
  computeDailyStreak,
  computeWeeklyStreak,
  computeDaysClean,
  needsAttention,
  type CheckLike,
  type ScoringHabit,
} from "./utils/scoring";

/**
 * Habits Service — pure business logic. Resolvers pass userId +
 * organizationId in; timezone/weekStartsOn come from user-settings and are
 * passed by the resolver too (same pattern as time-tracking's dailyTotals).
 */

// ----- Habit CRUD -----

export interface HabitInput {
  name: string;
  type: string;
  frequency?: string | null;
  timesPerWeek?: number | null;
  position?: number | null;
  intention?: string | null;
  starter?: string | null;
  identity?: string | null;
  notes?: string | null;
}

interface NormalizedHabitInput {
  name: string;
  type: "good" | "bad";
  frequency: "daily" | "weekly";
  timesPerWeek: number | null;
  position: number;
  intention: string | null;
  starter: string | null;
  identity: string | null;
  notes: string | null;
}

function normalizeHabitInput(input: HabitInput): NormalizedHabitInput {
  const name = input.name?.trim();
  if (!name) throw new ValidationError("Habit name is required");
  if (!(HABIT_TYPES as readonly string[]).includes(input.type)) {
    throw new ValidationError(`type must be one of: ${HABIT_TYPES.join(", ")}`);
  }
  const type = input.type as "good" | "bad";

  // Bad habits are implicitly "avoid every day" — frequency is forced.
  if (type === "bad") {
    return {
      name,
      type,
      frequency: "daily",
      timesPerWeek: null,
      position: input.position ?? 0,
      intention: input.intention?.trim() || null,
      starter: input.starter?.trim() || null,
      identity: input.identity?.trim() || null,
      notes: input.notes?.trim() || null,
    };
  }

  const frequency = input.frequency ?? "daily";
  if (!(HABIT_FREQUENCIES as readonly string[]).includes(frequency)) {
    throw new ValidationError(`frequency must be one of: ${HABIT_FREQUENCIES.join(", ")}`);
  }
  let timesPerWeek: number | null = null;
  if (frequency === "weekly") {
    const n = input.timesPerWeek;
    if (n == null || !Number.isInteger(n) || n < 1 || n > 7) {
      throw new ValidationError("timesPerWeek must be an integer between 1 and 7 for weekly habits");
    }
    timesPerWeek = n;
  }
  return {
    name,
    type,
    frequency: frequency as "daily" | "weekly",
    timesPerWeek,
    position: input.position ?? 0,
    intention: input.intention?.trim() || null,
    starter: input.starter?.trim() || null,
    identity: input.identity?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

async function getOwnedHabit(
  userId: string,
  organizationId: string,
  id: string
): Promise<Habit> {
  const rows = await db
    .select()
    .from(habits)
    .where(
      and(
        eq(habits.id, id),
        eq(habits.userId, userId),
        eq(habits.organizationId, organizationId)
      )
    )
    .limit(1);
  if (rows.length === 0) throw new NotFoundError("Habit");
  return rows[0];
}

export async function listHabits(
  userId: string,
  organizationId: string,
  status?: string | null
): Promise<Habit[]> {
  if (status != null && !(HABIT_STATUSES as readonly string[]).includes(status)) {
    throw new ValidationError(`status must be one of: ${HABIT_STATUSES.join(", ")}`);
  }
  const conditions = [
    eq(habits.userId, userId),
    eq(habits.organizationId, organizationId),
  ];
  if (status != null) conditions.push(eq(habits.status, status));
  return db
    .select()
    .from(habits)
    .where(and(...conditions))
    .orderBy(asc(habits.position), asc(habits.createdAt));
}

export async function createHabit(
  userId: string,
  organizationId: string,
  input: HabitInput
): Promise<Habit> {
  const normalized = normalizeHabitInput(input);
  const [row] = await db
    .insert(habits)
    .values({ userId, organizationId, ...normalized })
    .returning();
  return row;
}

export async function updateHabit(
  userId: string,
  organizationId: string,
  id: string,
  patch: Partial<HabitInput>
): Promise<Habit> {
  const current = await getOwnedHabit(userId, organizationId, id);
  // Merge patch over current, then re-validate the whole thing so the
  // frequency/timesPerWeek/type invariants always hold.
  const normalized = normalizeHabitInput({
    name: patch.name ?? current.name,
    type: patch.type ?? current.type,
    frequency: patch.frequency ?? current.frequency,
    timesPerWeek: patch.timesPerWeek === undefined ? current.timesPerWeek : patch.timesPerWeek,
    position: patch.position === undefined ? current.position : patch.position,
    intention: patch.intention === undefined ? current.intention : patch.intention,
    starter: patch.starter === undefined ? current.starter : patch.starter,
    identity: patch.identity === undefined ? current.identity : patch.identity,
    notes: patch.notes === undefined ? current.notes : patch.notes,
  });
  const [row] = await db
    .update(habits)
    .set({ ...normalized, updatedAt: new Date() })
    .where(eq(habits.id, current.id))
    .returning();
  return row;
}

/** Soft delete. In-sprint habits must be removed from the sprint first. */
export async function dropHabit(
  userId: string,
  organizationId: string,
  id: string
): Promise<Habit> {
  const current = await getOwnedHabit(userId, organizationId, id);
  if (current.status === "in_sprint") {
    throw new InvalidHabitStateError("Remove the habit from the active sprint first");
  }
  const [row] = await db
    .update(habits)
    .set({ status: "dropped", updatedAt: new Date() })
    .where(eq(habits.id, current.id))
    .returning();
  return row;
}

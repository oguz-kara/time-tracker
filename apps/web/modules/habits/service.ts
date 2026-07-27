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

// ----- Daily checks -----

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Streak/attention computations read at most this many days of history. */
const CHECK_HISTORY_DAYS = 120;

function assertValidDateKey(dateKey: string, today: string): void {
  if (!DATE_KEY_RE.test(dateKey)) {
    throw new ValidationError(`Invalid date: ${dateKey} (expected YYYY-MM-DD)`);
  }
  if (dateKey > today) throw new ValidationError("Cannot check a future date");
}

function assertCheckable(habit: Habit): void {
  if (habit.status !== "in_sprint" && habit.status !== "established") {
    throw new HabitNotCheckableError();
  }
}

/** Toggle a good habit's done-mark for a day. Returns the new state. */
export async function toggleCheck(
  userId: string,
  organizationId: string,
  habitId: string,
  dateKey: string,
  timezone: string
): Promise<boolean> {
  const habit = await getOwnedHabit(userId, organizationId, habitId);
  if (habit.type !== "good") {
    throw new InvalidHabitStateError("Bad habits track slips — use logSlip");
  }
  assertCheckable(habit);
  assertValidDateKey(dateKey, todayKey(timezone));

  const existing = await db
    .select()
    .from(habitChecks)
    .where(and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, dateKey)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(habitChecks).where(eq(habitChecks.id, existing[0].id));
    return false;
  }
  await db.insert(habitChecks).values({
    userId,
    organizationId,
    habitId,
    date: dateKey,
    kind: "done",
    count: 1,
  });
  return true;
}

/** Record (or increment) a slip on a bad habit. Returns the day's new count. */
export async function logSlip(
  userId: string,
  organizationId: string,
  habitId: string,
  dateKey: string,
  timezone: string
): Promise<number> {
  const habit = await getOwnedHabit(userId, organizationId, habitId);
  if (habit.type !== "bad") {
    throw new InvalidHabitStateError("Good habits track dones — use toggleCheck");
  }
  assertCheckable(habit);
  assertValidDateKey(dateKey, todayKey(timezone));

  const [row] = await db
    .insert(habitChecks)
    .values({ userId, organizationId, habitId, date: dateKey, kind: "slip", count: 1 })
    .onConflictDoUpdate({
      target: [habitChecks.habitId, habitChecks.date],
      set: { count: sql`${habitChecks.count} + 1` },
    })
    .returning();
  return row.count;
}

/** Decrement (or remove) a slip. Returns the remaining count. */
export async function undoSlip(
  userId: string,
  organizationId: string,
  habitId: string,
  dateKey: string,
  timezone: string
): Promise<number> {
  const habit = await getOwnedHabit(userId, organizationId, habitId);
  if (habit.type !== "bad") {
    throw new InvalidHabitStateError("Only bad habits have slips");
  }
  assertValidDateKey(dateKey, todayKey(timezone));

  const existing = await db
    .select()
    .from(habitChecks)
    .where(and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, dateKey)))
    .limit(1);
  if (existing.length === 0) return 0;

  if (existing[0].count > 1) {
    const [row] = await db
      .update(habitChecks)
      .set({ count: existing[0].count - 1 })
      .where(eq(habitChecks.id, existing[0].id))
      .returning();
    return row.count;
  }
  await db.delete(habitChecks).where(eq(habitChecks.id, existing[0].id));
  return 0;
}

/** For bad habits with no slips yet: days-clean counts from the start of the
 *  earliest sprint that ever contained the habit (fallback: creation day). */
async function getTrackingStarts(habitIds: string[]): Promise<Map<string, string>> {
  if (habitIds.length === 0) return new Map();
  const rows = await db
    .select({
      habitId: sprintHabits.habitId,
      start: sql<string>`min(${sprints.startsOn})`,
    })
    .from(sprintHabits)
    .innerJoin(sprints, eq(sprints.id, sprintHabits.sprintId))
    .where(inArray(sprintHabits.habitId, habitIds))
    .groupBy(sprintHabits.habitId);
  return new Map(rows.map((r) => [r.habitId, r.start]));
}

/** The Today screen's data: all checkable habits with their state for `dateKey`. */
export async function getDailyChecklist(
  userId: string,
  organizationId: string,
  dateKey: string,
  timezone: string,
  weekStartsOn: 0 | 1
): Promise<ChecklistItem[]> {
  assertValidDateKey(dateKey, todayKey(timezone));

  const active = await db
    .select()
    .from(habits)
    .where(
      and(
        eq(habits.userId, userId),
        eq(habits.organizationId, organizationId),
        inArray(habits.status, ["in_sprint", "established"])
      )
    )
    .orderBy(asc(habits.position), asc(habits.createdAt));
  if (active.length === 0) return [];

  const habitIds = active.map((h) => h.id);
  const floor = addDays(dateKey, -CHECK_HISTORY_DAYS);
  const checkRows = await db
    .select()
    .from(habitChecks)
    .where(
      and(
        eq(habitChecks.userId, userId),
        eq(habitChecks.organizationId, organizationId),
        inArray(habitChecks.habitId, habitIds),
        gte(habitChecks.date, floor),
        lte(habitChecks.date, dateKey)
      )
    );
  const trackingStarts = await getTrackingStarts(
    active.filter((h) => h.type === "bad").map((h) => h.id)
  );

  const items = active.map((habit) => {
    const mine: CheckLike[] = checkRows
      .filter((c) => c.habitId === habit.id)
      .map((c) => ({ date: c.date, kind: c.kind as "done" | "slip", count: c.count }));
    const todayRow = mine.find((c) => c.date === dateKey);
    const scoring: ScoringHabit = {
      type: habit.type as "good" | "bad",
      frequency: habit.frequency as "daily" | "weekly",
      timesPerWeek: habit.timesPerWeek,
    };

    let streak = 0;
    let thisWeekCount = 0;
    if (habit.type === "bad") {
      const slipDates = mine.filter((c) => c.kind === "slip").map((c) => c.date);
      const trackingStart =
        trackingStarts.get(habit.id) ?? dateKeyInTz(habit.createdAt, timezone);
      streak = computeDaysClean(slipDates, trackingStart, dateKey);
    } else if (habit.frequency === "weekly" && habit.timesPerWeek) {
      const doneDates = mine.filter((c) => c.kind === "done").map((c) => c.date);
      const weekly = computeWeeklyStreak(doneDates, dateKey, habit.timesPerWeek, weekStartsOn);
      streak = weekly.weeks;
      thisWeekCount = weekly.thisWeekCount;
    } else {
      const doneDates = new Set(mine.filter((c) => c.kind === "done").map((c) => c.date));
      streak = computeDailyStreak(doneDates, dateKey);
    }

    return {
      habit,
      checkedToday: habit.type === "good" && todayRow?.kind === "done",
      slipCountToday: habit.type === "bad" ? (todayRow?.count ?? 0) : 0,
      streak,
      thisWeekCount,
      needsAttention: needsAttention(scoring, mine, dateKey, weekStartsOn),
    };
  });

  // in_sprint first, established after; stable within each group.
  return [
    ...items.filter((i) => i.habit.status === "in_sprint"),
    ...items.filter((i) => i.habit.status === "established"),
  ];
}

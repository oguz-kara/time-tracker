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

// ----- Sprints -----

const SPRINT_LENGTHS_WEEKS = [1, 2, 3, 4];

/** Habit status applied when a retro decision lands. */
const STATUS_BY_OUTCOME: Record<string, string> = {
  graduated: "established",
  carried: "backlog",
  returned: "backlog",
  dropped: "dropped",
};

async function getActiveSprintRow(
  userId: string,
  organizationId: string
): Promise<Sprint | null> {
  const rows = await db
    .select()
    .from(sprints)
    .where(
      and(
        eq(sprints.userId, userId),
        eq(sprints.organizationId, organizationId),
        eq(sprints.status, "active")
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

async function getSprintChecks(
  habitIds: string[],
  startKey: string,
  endKey: string
): Promise<Map<string, CheckLike[]>> {
  const map = new Map<string, CheckLike[]>();
  if (habitIds.length === 0) return map;
  const rows = await db
    .select()
    .from(habitChecks)
    .where(
      and(
        inArray(habitChecks.habitId, habitIds),
        gte(habitChecks.date, startKey),
        lte(habitChecks.date, endKey)
      )
    );
  for (const r of rows) {
    const list = map.get(r.habitId) ?? [];
    list.push({ date: r.date, kind: r.kind as "done" | "slip", count: r.count });
    map.set(r.habitId, list);
  }
  return map;
}

function toScoring(habit: Habit): ScoringHabit {
  return {
    type: habit.type as "good" | "bad",
    frequency: habit.frequency as "daily" | "weekly",
    timesPerWeek: habit.timesPerWeek,
  };
}

export async function getActiveSprintView(
  userId: string,
  organizationId: string,
  timezone: string
): Promise<ActiveSprintView | null> {
  const sprint = await getActiveSprintRow(userId, organizationId);
  if (!sprint) return null;

  const memberRows = await db
    .select({ member: sprintHabits, habit: habits })
    .from(sprintHabits)
    .innerJoin(habits, eq(habits.id, sprintHabits.habitId))
    .where(eq(sprintHabits.sprintId, sprint.id));

  // Mid-sprint-dropped members keep their snapshot but leave the live view.
  const live = memberRows.filter((m) => m.member.outcome === null);
  const today = todayKey(timezone);
  const checksByHabit = await getSprintChecks(
    live.map((m) => m.habit.id),
    sprint.startsOn,
    sprint.endsOn
  );

  const members: SprintMemberProgress[] = live.map((m) => ({
    habit: m.habit,
    completionPct: completionPct(
      toScoring(m.habit),
      checksByHabit.get(m.habit.id) ?? [],
      sprint.startsOn,
      sprint.endsOn,
      today
    ),
    outcome: null,
  }));

  const totalDays = diffDays(sprint.endsOn, sprint.startsOn) + 1;
  const dayNumber = Math.min(totalDays, Math.max(1, diffDays(today, sprint.startsOn) + 1));
  const overallPct =
    members.length === 0
      ? 0
      : Math.round(members.reduce((acc, m) => acc + m.completionPct, 0) / members.length);

  return {
    sprint,
    dayNumber,
    totalDays,
    overallPct,
    isPastEnd: today > sprint.endsOn,
    members,
  };
}

export async function startSprint(
  userId: string,
  organizationId: string,
  timezone: string,
  input: { lengthWeeks: number; habitIds: string[]; name?: string | null }
): Promise<Sprint> {
  if (!SPRINT_LENGTHS_WEEKS.includes(input.lengthWeeks)) {
    throw new ValidationError("lengthWeeks must be 1, 2, 3 or 4");
  }
  const uniqueIds = [...new Set(input.habitIds)];
  if (uniqueIds.length === 0) {
    throw new ValidationError("Pick at least one habit for the sprint");
  }
  const rows = await db
    .select()
    .from(habits)
    .where(
      and(
        eq(habits.userId, userId),
        eq(habits.organizationId, organizationId),
        inArray(habits.id, uniqueIds)
      )
    );
  if (rows.length !== uniqueIds.length) throw new NotFoundError("Habit");
  for (const h of rows) {
    if (h.status !== "backlog") {
      throw new InvalidHabitStateError(`"${h.name}" is not in the backlog`);
    }
  }

  const start = todayKey(timezone);
  const end = addDays(start, input.lengthWeeks * 7 - 1);
  const [{ n }] = (await db
    .select({ n: sql<number>`count(*)::int` })
    .from(sprints)
    .where(and(eq(sprints.userId, userId), eq(sprints.organizationId, organizationId)))) as [
    { n: number },
  ];
  const name = input.name?.trim() || `Sprint ${n + 1}`;

  try {
    return await db.transaction(async (tx) => {
      const [sprint] = await tx
        .insert(sprints)
        .values({ userId, organizationId, name, startsOn: start, endsOn: end })
        .returning();
      await tx
        .insert(sprintHabits)
        .values(uniqueIds.map((habitId) => ({ sprintId: sprint.id, habitId })));
      await tx
        .update(habits)
        .set({ status: "in_sprint", updatedAt: new Date() })
        .where(inArray(habits.id, uniqueIds));
      return sprint;
    });
  } catch (err: unknown) {
    // Partial unique index (one active sprint per user) → 23505
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      throw new SprintAlreadyActiveError();
    }
    throw err;
  }
}

/** Mid-sprint swap-in from the backlog. */
export async function addHabitToSprint(
  userId: string,
  organizationId: string,
  habitId: string
): Promise<void> {
  const sprint = await getActiveSprintRow(userId, organizationId);
  if (!sprint) throw new NoActiveSprintError();
  const habit = await getOwnedHabit(userId, organizationId, habitId);
  if (habit.status !== "backlog") {
    throw new InvalidHabitStateError(`"${habit.name}" is not in the backlog`);
  }
  await db.transaction(async (tx) => {
    // Re-adding a habit that was dropped earlier in this same sprint revives
    // the membership row (composite PK) with a clean slate.
    await tx
      .insert(sprintHabits)
      .values({ sprintId: sprint.id, habitId: habit.id })
      .onConflictDoUpdate({
        target: [sprintHabits.sprintId, sprintHabits.habitId],
        set: { outcome: null, completionPct: null },
      });
    await tx
      .update(habits)
      .set({ status: "in_sprint", updatedAt: new Date() })
      .where(eq(habits.id, habit.id));
  });
}

/** Mid-sprint drop: records outcome + snapshot, returns habit to backlog. */
export async function removeHabitFromSprint(
  userId: string,
  organizationId: string,
  habitId: string,
  timezone: string
): Promise<void> {
  const sprint = await getActiveSprintRow(userId, organizationId);
  if (!sprint) throw new NoActiveSprintError();
  const habit = await getOwnedHabit(userId, organizationId, habitId);
  const memberRows = await db
    .select()
    .from(sprintHabits)
    .where(and(eq(sprintHabits.sprintId, sprint.id), eq(sprintHabits.habitId, habitId)))
    .limit(1);
  if (memberRows.length === 0 || memberRows[0].outcome !== null) {
    throw new NotFoundError("Sprint membership");
  }

  const today = todayKey(timezone);
  const checksByHabit = await getSprintChecks([habitId], sprint.startsOn, sprint.endsOn);
  const pct = completionPct(
    toScoring(habit),
    checksByHabit.get(habitId) ?? [],
    sprint.startsOn,
    sprint.endsOn,
    today
  );

  await db.transaction(async (tx) => {
    await tx
      .update(sprintHabits)
      .set({ outcome: "dropped", completionPct: pct })
      .where(and(eq(sprintHabits.sprintId, sprint.id), eq(sprintHabits.habitId, habitId)));
    await tx
      .update(habits)
      .set({ status: "backlog", updatedAt: new Date() })
      .where(eq(habits.id, habitId));
  });
}

export async function completeRetro(
  userId: string,
  organizationId: string,
  sprintId: string,
  decisions: { habitId: string; outcome: string }[],
  retroNotes: string | null,
  timezone: string
): Promise<void> {
  const rows = await db
    .select()
    .from(sprints)
    .where(
      and(
        eq(sprints.id, sprintId),
        eq(sprints.userId, userId),
        eq(sprints.organizationId, organizationId)
      )
    )
    .limit(1);
  if (rows.length === 0) throw new NotFoundError("Sprint");
  const sprint = rows[0];
  if (sprint.status !== "active") throw new ValidationError("Sprint is not active");

  const memberRows = await db
    .select({ member: sprintHabits, habit: habits })
    .from(sprintHabits)
    .innerJoin(habits, eq(habits.id, sprintHabits.habitId))
    .where(eq(sprintHabits.sprintId, sprint.id));
  const pending = memberRows.filter((m) => m.member.outcome === null);

  const byHabitId = new Map(decisions.map((d) => [d.habitId, d.outcome]));
  if (byHabitId.size !== decisions.length) {
    throw new ValidationError("Duplicate decision for a habit");
  }
  const pendingIds = new Set(pending.map((m) => m.habit.id));
  if (byHabitId.size !== pendingIds.size || ![...byHabitId.keys()].every((id) => pendingIds.has(id))) {
    throw new ValidationError("Retro needs exactly one decision per remaining sprint habit");
  }
  for (const outcome of byHabitId.values()) {
    if (!(SPRINT_OUTCOMES as readonly string[]).includes(outcome)) {
      throw new ValidationError(`outcome must be one of: ${SPRINT_OUTCOMES.join(", ")}`);
    }
  }

  const today = todayKey(timezone);
  const checksByHabit = await getSprintChecks(
    pending.map((m) => m.habit.id),
    sprint.startsOn,
    sprint.endsOn
  );

  await db.transaction(async (tx) => {
    for (const m of pending) {
      const outcome = byHabitId.get(m.habit.id)!;
      const pct = completionPct(
        toScoring(m.habit),
        checksByHabit.get(m.habit.id) ?? [],
        sprint.startsOn,
        sprint.endsOn,
        today
      );
      await tx
        .update(sprintHabits)
        .set({ outcome, completionPct: pct })
        .where(and(eq(sprintHabits.sprintId, sprint.id), eq(sprintHabits.habitId, m.habit.id)));
      await tx
        .update(habits)
        .set({ status: STATUS_BY_OUTCOME[outcome], updatedAt: new Date() })
        .where(eq(habits.id, m.habit.id));
    }
    await tx
      .update(sprints)
      .set({ status: "completed", retroNotes: retroNotes?.trim() || null })
      .where(eq(sprints.id, sprint.id));
  });
}

export async function listCompletedSprints(
  userId: string,
  organizationId: string
): Promise<CompletedSprintView[]> {
  const rows = await db
    .select()
    .from(sprints)
    .where(
      and(
        eq(sprints.userId, userId),
        eq(sprints.organizationId, organizationId),
        eq(sprints.status, "completed")
      )
    )
    .orderBy(desc(sprints.endsOn));
  if (rows.length === 0) return [];

  const memberRows = await db
    .select({ member: sprintHabits, habit: habits })
    .from(sprintHabits)
    .innerJoin(habits, eq(habits.id, sprintHabits.habitId))
    .where(inArray(sprintHabits.sprintId, rows.map((s) => s.id)));

  return rows.map((sprint) => {
    const members: SprintMemberProgress[] = memberRows
      .filter((m) => m.member.sprintId === sprint.id)
      .map((m) => ({
        habit: m.habit,
        completionPct: m.member.completionPct ?? 0,
        outcome: m.member.outcome,
      }));
    const overallPct =
      members.length === 0
        ? 0
        : Math.round(members.reduce((acc, m) => acc + m.completionPct, 0) / members.length);
    return { sprint, overallPct, members };
  });
}

/** Backlog habits + their latest sprint outcome (planner pre-checks 'carried'). */
export async function listBacklogForPlanning(
  userId: string,
  organizationId: string
): Promise<BacklogPlanningHabit[]> {
  const backlog = await listHabits(userId, organizationId, "backlog");
  if (backlog.length === 0) return [];
  const result = await db.execute(sql`
    SELECT DISTINCT ON (sh.habit_id) sh.habit_id, sh.outcome
    FROM sprint_habits sh
    JOIN sprints s ON s.id = sh.sprint_id
    WHERE s.user_id = ${userId}
      AND s.organization_id = ${organizationId}
      AND sh.habit_id IN ${sql.raw(`('${backlog.map((h) => h.id).join("','")}')`)}
    ORDER BY sh.habit_id, s.starts_on DESC
  `);
  const resultRows = result as unknown as Array<{ habit_id: string; outcome: string | null }>;
  const lastOutcomes = new Map(resultRows.map((r) => [r.habit_id, r.outcome]));
  return backlog.map((habit) => ({
    habit,
    lastOutcome: lastOutcomes.get(habit.id) ?? null,
  }));
}

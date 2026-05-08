import { db, eq, and, sql, isNull, gte, lt, desc } from "@jetframe/db";
import { timeEntries } from "@jetframe/db/schema/time-tracking";
import type { TimeEntry, DailyTotal } from "./types";
import {
  AlreadyRunningError,
  NoRunningTimerError,
  OverlapError,
  InvalidTimeRangeError,
  NotFoundError,
} from "@/modules/shared/errors";

/**
 * Time Tracking Service
 * Pure business logic. Resolvers pass userId + organizationId in.
 */

// ----- Reads -----

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
 * Distinct list of tags the user has ever applied to any of their entries
 * (within the active org), sorted alphabetically. Used for the tag filter
 * dropdown and the chip-input autocomplete in the entry editor.
 *
 * Implementation note: tags is a `text[]` column. `unnest()` produces one
 * row per array element. `array_length(tags, 1) > 0` short-circuits empty
 * arrays so they don't enter the unnest at all (they would yield zero rows
 * anyway, but the filter keeps the plan tighter).
 */
export async function listUserTags(
  userId: string,
  organizationId: string
): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT unnest(tags) AS tag
    FROM time_entries
    WHERE user_id = ${userId}
      AND organization_id = ${organizationId}
      AND array_length(tags, 1) > 0
    ORDER BY 1
  `);
  const rows = result as unknown as Array<{ tag: string }>;
  return rows.map((r) => r.tag);
}

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

export async function getDailyTotals(
  userId: string,
  organizationId: string,
  from: Date,
  to: Date,
  timezone: string
): Promise<DailyTotal[]> {
  // Clamp the duration to [from, to) so a still-running entry that extends
  // past `to` doesn't over-count, and a long entry that started before `from`
  // is still bounded correctly. The WHERE filters by `start` only, so the
  // clamp inside SUM is what does the actual time-bucket math.
  const result = await db.execute(sql`
    SELECT
      to_char(date_trunc('day', "start" AT TIME ZONE ${timezone}), 'YYYY-MM-DD') AS date,
      SUM(
        EXTRACT(EPOCH FROM (
          LEAST(COALESCE("stop", now()), ${to.toISOString()}::timestamp)
          - GREATEST("start", ${from.toISOString()}::timestamp)
        )) / 60
      )::int AS total_minutes
    FROM time_entries
    WHERE user_id = ${userId}
      AND organization_id = ${organizationId}
      AND "start" >= ${from.toISOString()}
      AND "start" <  ${to.toISOString()}
    GROUP BY 1
    ORDER BY 1
  `);

  // postgres-js returns rows as the result array directly
  const rows = result as unknown as Array<{ date: string; total_minutes: number }>;
  return rows.map((r) => ({ date: r.date, totalMinutes: Number(r.total_minutes) }));
}

// ----- Helpers -----

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
      AND ${start.toISOString()} < COALESCE("stop", now())
      AND "start" < ${stop.toISOString()}
      ${excludeId ? sql`AND id <> ${excludeId}` : sql``}
    LIMIT 1
  `);
  const rows = conflicts as unknown as Array<{ id: string }>;
  if (rows.length > 0) {
    throw new OverlapError(`Overlaps existing entry ${rows[0].id}`);
  }
}

// ----- Writes -----

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
    // Postgres unique violation error code on the partial index → already running
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

  // Cannot transition a running entry to stopped via update — must use stopTimer.
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

  // Only re-check overlap when the time window actually changes. Editing
  // description/tags on a running entry shouldn't trigger an overlap check
  // against now() — that can spuriously fail if any historical entry was
  // recorded during the running entry's window via a manual create.
  const timeChanging = patch.start !== undefined || patch.stop !== undefined;
  if (timeChanging) {
    // Overlap check uses now() as the running entry's effective end if stop is null.
    const overlapEnd = newStop ?? new Date();
    await assertNoOverlap(userId, organizationId, newStart, overlapEnd, id);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
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

import { db, eq } from "@jetframe/db";
import { userSettings } from "@jetframe/db/schema/time-tracking";
import type { UserSettings } from "./types";
import { ValidationError } from "@/modules/shared/errors";
import { isLocale } from "@/i18n/config";

export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  // Race-safe upsert: if two concurrent first-time reads land here, one wins
  // the insert and the other's INSERT is skipped via ON CONFLICT. Either way
  // we re-select and return the row.
  await db
    .insert(userSettings)
    .values({ userId })
    .onConflictDoNothing({ target: userSettings.userId });

  const [row] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
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
  patch: {
    dailyGoalMinutes?: number;
    weekStartsOn?: number;
    timezone?: string;
    locale?: string;
  }
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
  if (patch.locale !== undefined && !isLocale(patch.locale)) {
    throw new ValidationError(`Unsupported locale: ${patch.locale}`);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.dailyGoalMinutes !== undefined) updates.dailyGoalMinutes = patch.dailyGoalMinutes;
  if (patch.weekStartsOn !== undefined) updates.weekStartsOn = patch.weekStartsOn;
  if (patch.timezone !== undefined) updates.timezone = patch.timezone;
  if (patch.locale !== undefined) updates.locale = patch.locale;

  const [row] = await db
    .update(userSettings)
    .set(updates)
    .where(eq(userSettings.userId, userId))
    .returning();
  return row;
}

"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db, eq } from "@jetframe/db";
import { userSettings } from "@jetframe/db/schema/time-tracking";
import { isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * Switch the active locale.
 *
 * - Always writes the LOCALE_COOKIE so the next page render reads the new value.
 * - For authenticated users, also persists to user_settings.locale so the
 *   choice survives a fresh browser / incognito session.
 *
 * Returns nothing — the caller is expected to refresh / navigate to pick up
 * the new locale.
 */
export async function setLocaleAction(next: Locale | string): Promise<void> {
  if (!isLocale(next)) {
    throw new Error(`Unsupported locale: ${next}`);
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  // Best-effort DB persistence for authed users; never fail the action over it.
  try {
    const session = await auth();
    if (session?.userId) {
      await db
        .update(userSettings)
        .set({ locale: next, updatedAt: new Date() })
        .where(eq(userSettings.userId, session.userId));
    }
  } catch (err) {
    console.warn("[setLocaleAction] failed to persist locale to DB:", err);
  }

  // Force re-render of the current route tree with the new locale
  revalidatePath("/", "layout");
}

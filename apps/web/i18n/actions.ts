"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateUserSettings } from "@/modules/user-settings/service";
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
  // Routes through updateUserSettings so the row is auto-created if missing
  // (UPDATE alone would silently no-op for users who haven't yet hit a code
  // path that materializes user_settings).
  try {
    const session = await auth();
    if (session?.userId) {
      await updateUserSettings(session.userId, { locale: next });
    }
  } catch (err) {
    console.warn("[setLocaleAction] failed to persist locale to DB:", err);
  }

  // Force re-render of the current route tree with the new locale
  revalidatePath("/", "layout");
}

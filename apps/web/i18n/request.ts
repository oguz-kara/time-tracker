import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * Resolves the active locale per request.
 * Priority:
 *   1. tracker.locale cookie (set by the in-app language switcher)
 *   2. defaultLocale ("en")
 *
 * We intentionally don't read user_settings.locale here because that would
 * require hitting the DB on every request. The switcher writes BOTH the
 * cookie and (when authenticated) the DB row, so the cookie is always the
 * truthful "what does this user want right now" signal.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const fromCookie = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(fromCookie) ? fromCookie : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

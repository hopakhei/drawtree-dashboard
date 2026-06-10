import { cookies, headers } from "next/headers";
import { isLocale, Locale, localeFromAcceptLanguage, LOCALE_COOKIE } from "./index";
import { getMessages, Messages } from "./messages";

// Server-side locale resolution for layouts / server components.
// Reading cookies()/headers() opts the route into dynamic rendering,
// which is acceptable for this dashboard (data fetches keep their own
// revalidate caching).
export function getLocale(): Locale {
  const c = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  return localeFromAcceptLanguage(headers().get("accept-language"));
}

export function getServerMessages(): { locale: Locale; m: Messages } {
  const locale = getLocale();
  return { locale, m: getMessages(locale) };
}

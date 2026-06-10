// Minimal bilingual (en / zh-Hant) i18n core. No external dependency:
// the site is small enough that a typed message catalog + React context
// beats pulling in a full i18n framework, and cookie-based locale (no
// /en /zh URL prefixes) keeps the OAuth ?next= redirects intact.
//
// Locale resolution order:
//   1. dt_locale cookie (set by the header switcher — durable choice)
//   2. Accept-Language: any zh-* (zh-HK, zh-TW, zh-Hant, zh-CN…) → zh
//   3. en

export type Locale = "en" | "zh";

export const LOCALE_COOKIE = "dt_locale";

export const LOCALES: Locale[] = ["en", "zh"];

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "zh";
}

export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "en";
  // Highest-q zh-* wins over plain order; a simple scan over the listed
  // tags in order is close enough for a two-locale site.
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (tag === "zh" || tag.startsWith("zh-")) return "zh";
    if (tag === "en" || tag.startsWith("en-")) return "en";
  }
  return "en";
}

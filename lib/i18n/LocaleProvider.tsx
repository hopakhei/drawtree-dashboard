"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale, LOCALE_COOKIE } from "./index";
import { getMessages, Messages } from "./messages";

type I18nContext = {
  locale: Locale;
  m: Messages;
  setLocale: (l: Locale) => void;
};

const Ctx = createContext<I18nContext | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      try {
        // Durable choice — one year, whole site.
        document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = l === "zh" ? "zh-Hant" : "en";
      } catch {}
      // Re-render server components (home, /t/[ticker]) in the new locale.
      router.refresh();
    },
    [router],
  );

  return (
    <Ctx.Provider value={{ locale, m: getMessages(locale), setLocale }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n(): I18nContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside <LocaleProvider>");
  return ctx;
}

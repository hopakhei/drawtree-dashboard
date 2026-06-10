"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n";

// Fixed EN/中文 toggle, rendered from the root layout so it appears on
// every page without each page needing its own header.
export default function LangSwitcher() {
  const { locale, m, setLocale } = useI18n();
  const options: { value: Locale; label: string }[] = [
    { value: "en", label: m.langSwitcher.en },
    { value: "zh", label: m.langSwitcher.zh },
  ];
  return (
    <div
      className="fixed top-3 right-3 z-50 flex items-center border border-line rounded bg-paper/90 backdrop-blur-sm text-xs overflow-hidden"
      role="group"
      aria-label={m.langSwitcher.label}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setLocale(o.value)}
          aria-pressed={locale === o.value}
          className={`px-2.5 py-1.5 transition ${
            locale === o.value
              ? "bg-ink text-paper"
              : "text-muted hover:bg-line/40"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

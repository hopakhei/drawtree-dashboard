"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n";

// EN/中文 toggle. Rendered inline inside SiteNav — it used to be a fixed
// overlay in the top-right corner, which floated over page content and
// competed with the (previously missing) sign-in entry point.
export default function LangSwitcher() {
  const { locale, m, setLocale } = useI18n();
  const options: { value: Locale; label: string }[] = [
    { value: "en", label: m.langSwitcher.en },
    { value: "zh", label: m.langSwitcher.zh },
  ];
  return (
    <div
      className="flex items-center border border-line rounded bg-paper/90 text-xs overflow-hidden shrink-0"
      role="group"
      aria-label={m.langSwitcher.label}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setLocale(o.value)}
          aria-pressed={locale === o.value}
          className={`px-2 py-1.5 transition ${
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

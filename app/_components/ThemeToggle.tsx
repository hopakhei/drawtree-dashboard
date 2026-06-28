"use client";

import { useState, useTransition } from "react";

export default function ThemeToggle({
  initial = "reasoning",
}: {
  initial?: "reasoning" | "terminal";
}) {
  const [theme, setTheme] = useState<"reasoning" | "terminal">(initial);
  const [, startTransition] = useTransition();

  function apply(next: "reasoning" | "terminal") {
    setTheme(next);
    document.cookie = `dt_theme=${next}; path=/; max-age=31536000; samesite=lax`;
    if (next === "reasoning") {
      document.documentElement.setAttribute("data-theme", "reasoning");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    startTransition(() => {});
  }

  const opts: ["reasoning" | "terminal", string][] = [
    ["reasoning", "Reasoning"],
    ["terminal", "Terminal"],
  ];

  return (
    <div className="fixed top-3 right-4 z-50 flex gap-0.5 p-0.5 rounded-full border border-line bg-raised shadow-sm">
      {opts.map(([key, label]) => (
        <button
          key={key}
          onClick={() => apply(key)}
          className={`px-3 py-1 text-[11px] tracking-wide rounded-full transition-colors ${
            theme === key
              ? "bg-ink text-paper"
              : "text-muted hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

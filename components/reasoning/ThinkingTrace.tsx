"use client";

import { useState } from "react";

export type VerdictKey =
  | "validated"
  | "trending-positive"
  | "inconclusive"
  | "trending-negative"
  | "approaching"
  | "falsified"
  | "pending";

const GLYPH: Record<VerdictKey, string> = {
  validated: "✓",
  "trending-positive": "↑",
  inconclusive: "·",
  "trending-negative": "↓",
  approaching: "!",
  falsified: "✗",
  pending: "—",
};

export type ThinkingStep = {
  text: React.ReactNode;
  verdict?: VerdictKey;
};

export function ThinkingTrace({
  steps,
  title = "How this verdict was reached",
  defaultOpen = true,
}: {
  steps: ThinkingStep[];
  title?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-sunken border border-line rounded overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 w-full text-left px-5 py-4"
      >
        <span className="inline-flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[5px] h-[5px] rounded-full bg-clay animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </span>
        <span className="flex-1 text-[11px] uppercase tracking-[0.14em] text-muted">
          {title} · {steps.length} steps
        </span>
        <span className="text-muted text-xs">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <ol className="relative list-none m-0 px-5 pb-5 pl-[22px]">
          <span className="absolute left-[27px] top-2.5 bottom-7 w-px bg-line" />
          {steps.map((s, i) => {
            const fg = s.verdict ? `var(--vd-${s.verdict})` : "var(--clay)";
            const bg = s.verdict ? `var(--vd-${s.verdict}-bg)` : "var(--paper-raised)";
            return (
              <li
                key={i}
                className="dt-reveal relative pl-6"
                style={{ paddingBottom: i === steps.length - 1 ? 0 : 16, animationDelay: `${i * 90}ms` }}
              >
                <span
                  className="absolute left-0 top-[5px] w-[11px] h-[11px] rounded-full"
                  style={{ background: bg, border: `1.5px solid ${fg}` }}
                />
                <div className="font-serif text-[16px] leading-[1.6] text-ink">
                  {s.verdict && (
                    <span className="font-mono font-bold mr-[7px]" style={{ color: fg }}>
                      {GLYPH[s.verdict]}
                    </span>
                  )}
                  {s.text}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

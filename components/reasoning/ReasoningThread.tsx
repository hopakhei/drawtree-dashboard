import * as React from "react";

export type ReasoningStep = {
  label: React.ReactNode;
  body: React.ReactNode;
};

export function ReasoningThread({ steps }: { steps: ReasoningStep[] }) {
  return (
    <ol className="relative list-none m-0 p-0">
      <span className="absolute left-1 top-2 bottom-2 w-px bg-line" />
      {steps.map((s, i) => (
        <li
          key={i}
          className="relative pl-[22px]"
          style={{ paddingBottom: i === steps.length - 1 ? 0 : 14 }}
        >
          <span className="absolute left-0 top-1.5 w-[9px] h-[9px] rounded-full bg-sunken border-[1.5px] border-clay" />
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mb-1">
            {s.label}
          </div>
          <div>{s.body}</div>
        </li>
      ))}
    </ol>
  );
}

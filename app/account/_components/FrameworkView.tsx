"use client";

import { useState } from "react";

// Shared renderer that takes a normalized Draw Tree framework (assembled
// either from /v1/account/draft/{id} or /v1/trees/{id}/payload) and shows
// it as a collapsible interactive view: H-0 → branches → leaves → scenarios.
//
// Every block is optional — early-stage drafts will only have narrative
// + H-0, while committed trees will have all five.

export type Branch = {
  id: string;
  caption?: string;
  label?: string;
  core_question?: string;
  framework?: { name?: string; from?: string; to?: string };
  weight?: number;
  order?: number;
  leaves?: Leaf[]; // present on committed-tree payload, not on draft branches block
};

export type Leaf = {
  id?: string;
  question?: string;
  hypothesis?: string;
  data_points?: any[];
  falsification?: {
    metric?: string;
    operator?: string;
    threshold?: any;
    window?: string;
  };
  verdict?: string | { label?: string; score?: number };
  notes?: string;
  conclusion?: string;
  evidence?: any;
};

export type Scenarios = {
  // computed (post compute_scenarios)
  bull?: { value?: number; pct?: number; narrative?: string };
  base?: { value?: number; pct?: number; narrative?: string };
  bear?: { value?: number; pct?: number; narrative?: string };
  current_price?: number;
  // skeleton (post design_scenarios)
  peer_tiers?: any;
  method?: string;
};

export type FrameworkData = {
  ticker: string;
  company?: string;
  stage?: string; // for drafts
  visibility?: string; // for trees
  committed_at?: string | null;
  updated_at?: string | null;
  framework_confirmed?: boolean;

  narrative?: {
    payload?: any;
    enriched?: any;
  } | null;

  h0?: {
    text?: string;
    metadata?: { framework_from?: string; framework_to?: string; time_window?: string };
  } | null;

  branches?: Branch[];
  mece_rationale?: string;
  leaves_by_branch?: Record<string, { leaves?: Leaf[]; enriched?: any }>;
  scenarios?: Scenarios | null;

  verdict?: any; // committed tree top-level verdict
};

const VERDICT_BADGE: Record<string, { icon: string; color: string; label: string }> = {
  validated:                   { icon: "✅", color: "text-emerald-700 bg-emerald-50 border-emerald-200", label: "Validated" },
  trending_positive:           { icon: "🟢", color: "text-emerald-600 bg-emerald-50/60 border-emerald-200", label: "Trending positive" },
  inconclusive:                { icon: "⚪", color: "text-muted bg-paper border-line", label: "Inconclusive" },
  trending_negative:           { icon: "🟠", color: "text-orange-700 bg-orange-50 border-orange-200", label: "Trending negative" },
  approaching_falsification:   { icon: "🟡", color: "text-amber-700 bg-amber-50 border-amber-200", label: "Approaching falsification" },
  falsified:                   { icon: "✗", color: "text-red-700 bg-red-50 border-red-200", label: "Falsified" },
};

function VerdictBadge({ verdict }: { verdict?: any }) {
  if (!verdict) return null;
  const key =
    typeof verdict === "string"
      ? verdict.toLowerCase().replace(/\s+/g, "_")
      : (verdict.label || verdict.verdict || "").toLowerCase().replace(/\s+/g, "_");
  const m = VERDICT_BADGE[key];
  if (!m) {
    return (
      <span className="text-xs px-2 py-0.5 rounded border border-line text-muted">
        {typeof verdict === "string" ? verdict : JSON.stringify(verdict).slice(0, 40)}
      </span>
    );
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
}

function LeafCard({ leaf }: { leaf: Leaf }) {
  const [open, setOpen] = useState(false);
  const f = leaf.falsification || {};
  const fHuman =
    f.metric || f.operator || f.threshold !== undefined
      ? `${f.metric ?? "?"} ${f.operator ?? ""} ${f.threshold ?? ""}${f.window ? ` (${f.window})` : ""}`
      : null;
  return (
    <li className="border border-line rounded">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-line/30"
      >
        <span className="text-muted text-xs mt-0.5">{open ? "▾" : "▸"}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <span className="text-muted mr-2 text-xs">{leaf.id || ""}</span>
            {leaf.hypothesis || leaf.question || "(no hypothesis text)"}
          </div>
          {fHuman && (
            <div className="text-xs text-muted mt-0.5 truncate">
              Falsify if: <code className="text-[11px]">{fHuman}</code>
            </div>
          )}
        </div>
        <VerdictBadge verdict={leaf.verdict} />
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-line text-sm space-y-2 bg-paper">
          {leaf.hypothesis && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">假設</div>
              <div>{leaf.hypothesis}</div>
            </div>
          )}
          {leaf.data_points && Array.isArray(leaf.data_points) && leaf.data_points.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">數據</div>
              <ul className="list-disc list-inside text-sm space-y-0.5">
                {leaf.data_points.slice(0, 8).map((d: any, i: number) => (
                  <li key={i}>
                    {typeof d === "string" ? d : d?.label ? `${d.label}: ${d.value ?? ""}` : JSON.stringify(d)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {leaf.conclusion && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">結論</div>
              <div>{leaf.conclusion}</div>
            </div>
          )}
          {fHuman && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">證偽條件</div>
              <code className="text-xs">{fHuman}</code>
            </div>
          )}
          {leaf.notes && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">註釋</div>
              <div className="text-muted">{leaf.notes}</div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function BranchSection({ branch, leaves }: { branch: Branch; leaves: Leaf[] }) {
  const [open, setOpen] = useState(true);
  const label = branch.caption || branch.label || branch.id;
  return (
    <section className="border border-line rounded">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-2 hover:bg-line/30"
      >
        <span className="text-muted text-xs mt-1">{open ? "▾" : "▸"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-wider text-muted">{branch.id}</span>
            <span className="font-medium">{label}</span>
          </div>
          {branch.core_question && (
            <div className="text-xs text-muted mt-0.5">{branch.core_question}</div>
          )}
          {branch.framework?.name && (
            <div className="text-[11px] text-muted mt-0.5">
              Framework: <code>{branch.framework.name}</code>
            </div>
          )}
        </div>
        <span className="text-xs text-muted shrink-0">
          {leaves.length} leaf{leaves.length === 1 ? "" : "s"}
        </span>
      </button>
      {open && leaves.length > 0 && (
        <ul className="border-t border-line p-3 space-y-2 bg-paper/40">
          {leaves.map((l, i) => (
            <LeafCard key={l.id || i} leaf={l} />
          ))}
        </ul>
      )}
      {open && leaves.length === 0 && (
        <div className="border-t border-line p-3 text-xs text-muted">
          No leaves saved yet for this branch.
        </div>
      )}
    </section>
  );
}

function ScenarioBlock({ scenarios }: { scenarios: Scenarios }) {
  const tiers = [
    { key: "bull", label: "Bull", icon: "🐂", data: scenarios.bull },
    { key: "base", label: "Base", icon: "🐃", data: scenarios.base },
    { key: "bear", label: "Bear", icon: "🐻", data: scenarios.bear },
  ];
  const hasAny = tiers.some((t) => t.data && (t.data.value !== undefined || t.data.pct !== undefined));
  if (!hasAny) {
    return (
      <div className="text-sm text-muted">
        Scenarios scaffolded but not yet computed.{scenarios.method ? ` Method: ${scenarios.method}.` : ""}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {scenarios.current_price !== undefined && (
        <div className="text-xs text-muted mb-1">Current price: ${scenarios.current_price}</div>
      )}
      {tiers.map((t) => {
        if (!t.data) return null;
        const pct = t.data.pct;
        return (
          <div key={t.key} className="border border-line rounded p-3">
            <div className="flex items-baseline justify-between">
              <div className="text-sm">
                <span className="mr-2">{t.icon}</span>
                <span className="font-medium">{t.label}</span>
                {t.data.value !== undefined && (
                  <span className="ml-2">${t.data.value}</span>
                )}
              </div>
              {pct !== undefined && (
                <span
                  className={`text-xs ${
                    pct > 0 ? "text-emerald-700" : pct < 0 ? "text-red-700" : "text-muted"
                  }`}
                >
                  {pct > 0 ? "+" : ""}
                  {pct.toFixed?.(1) ?? pct}%
                </span>
              )}
            </div>
            {t.data.narrative && (
              <div className="text-xs text-muted mt-1">{t.data.narrative}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FrameworkView({ data }: { data: FrameworkData }) {
  const branches = data.branches || [];
  const leavesByBranch = data.leaves_by_branch || {};
  const narrative = data.narrative?.payload || null;
  const versions =
    narrative && typeof narrative === "object"
      ? narrative.versions || narrative.narrative_versions || null
      : null;

  return (
    <div className="space-y-6">
      {/* H-0 */}
      <section className="border border-line rounded p-5">
        <div className="text-xs uppercase tracking-wider text-muted mb-2">
          H-0 · root hypothesis
        </div>
        {data.h0?.text ? (
          <p className="text-base leading-relaxed">{data.h0.text}</p>
        ) : (
          <p className="text-sm text-muted">H-0 not yet defined.</p>
        )}
        {data.h0?.metadata && (
          <div className="text-xs text-muted mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {data.h0.metadata.framework_from && (
              <span>
                From: <code>{data.h0.metadata.framework_from}</code>
              </span>
            )}
            {data.h0.metadata.framework_to && (
              <span>
                → <code>{data.h0.metadata.framework_to}</code>
              </span>
            )}
            {data.h0.metadata.time_window && (
              <span>Window: {data.h0.metadata.time_window}</span>
            )}
          </div>
        )}
        {data.verdict && (
          <div className="mt-3">
            <VerdictBadge verdict={data.verdict} />
          </div>
        )}
      </section>

      {/* Branches */}
      {branches.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg">Branches</h2>
            <span className="text-xs text-muted">
              {branches.length} branch{branches.length === 1 ? "" : "es"}
            </span>
          </div>
          <div className="space-y-3">
            {branches.map((b) => (
              <BranchSection
                key={b.id}
                branch={b}
                leaves={
                  b.leaves /* trees: leaves embedded in branch */ ??
                  leavesByBranch[b.id]?.leaves /* drafts: separate map */ ??
                  []
                }
              />
            ))}
          </div>
          {data.mece_rationale && (
            <p className="text-xs text-muted mt-3">
              <span className="uppercase tracking-wider">MECE rationale: </span>
              {data.mece_rationale}
            </p>
          )}
        </section>
      )}

      {/* Scenarios */}
      {data.scenarios && (
        <section>
          <h2 className="text-lg mb-3">3-Scenario valuation</h2>
          <ScenarioBlock scenarios={data.scenarios} />
        </section>
      )}

      {/* Narrative versions */}
      {versions && (
        <section className="border border-line rounded p-5">
          <h2 className="text-lg mb-3">Narrative archaeology</h2>
          <pre className="text-xs whitespace-pre-wrap break-words text-muted">
            {JSON.stringify(versions, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}

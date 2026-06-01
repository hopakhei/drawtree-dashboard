"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import FrameworkView, { FrameworkData } from "../../_components/FrameworkView";

const API_URL = "https://drawtree-api.onrender.com";

const NEXT_TOOL_BY_STAGE: Record<string, string> = {
  OPEN: "frame_narrative",
  AWAITING_NARRATIVE_SAVE: "save_narrative",
  NARRATIVE_SAVED: "frame_h0",
  AWAITING_H0_SAVE: "save_h0",
  H0_SAVED: "design_branches",
  AWAITING_BRANCHES_SAVE: "save_branches",
  BRANCHES_SAVED: "design_leaves",
  AWAITING_LEAVES_SAVE: "save_leaves",
  LEAVES_SAVED: "design_scenarios",
  AWAITING_SCENARIOS_SAVE: "save_scenarios",
  SCENARIOS_SAVED: "preview_tree → confirm_framework",
  FRAMEWORK_DONE: "phase2_run_all",
  DATA_NARRATIVE_DONE: "enrich_leaf_data",
  DATA_LEAVES_DONE: "compute_scenarios",
  SCENARIOS_LIVE: "commit_draft_tree",
  COMMITTED: "summarize_tree",
};

type DraftResponse = {
  draft_id: string;
  ticker: string;
  stage: string;
  framework_confirmed: boolean;
  created_at: string;
  updated_at: string;
  narrative: { payload: any; enriched: any; enriched_at: string | null } | null;
  h0: { text: string; metadata: any } | null;
  branches: { items: any[]; mece_rationale: string | null } | null;
  leaves_by_branch: Record<
    string,
    { leaves: any[]; enriched: any; enriched_at: string | null }
  >;
  scenarios: { skeleton: any; computed: any; computed_at: string | null } | null;
};

function normalize(d: DraftResponse): FrameworkData {
  // Merge skeleton + computed into a single scenarios object for the view.
  const sc = d.scenarios;
  const computed = sc?.computed || null;
  const skeleton = sc?.skeleton || null;
  const scenarios = sc
    ? {
        ...(skeleton || {}),
        ...(computed && typeof computed === "object" ? computed : {}),
      }
    : null;

  return {
    ticker: d.ticker,
    stage: d.stage,
    framework_confirmed: d.framework_confirmed,
    updated_at: d.updated_at,
    narrative: d.narrative,
    h0: d.h0 ? { text: d.h0.text, metadata: d.h0.metadata } : null,
    branches: d.branches?.items || [],
    mece_rationale: d.branches?.mece_rationale || undefined,
    leaves_by_branch: d.leaves_by_branch,
    scenarios: scenarios as any,
  };
}

export default function DraftPage({
  params,
}: {
  params: Promise<{ draft_id: string }>;
}) {
  const { draft_id } = use(params);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [data, setData] = useState<FrameworkData | null>(null);
  const [rawStage, setRawStage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const k = sessionStorage.getItem("drawtree_api_key");
      if (k) setApiKey(k);
      else {
        setError("Not signed in. Open /account first.");
        setLoading(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    setLoading(true);
    fetch(`${API_URL}/v1/account/draft/${draft_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d: DraftResponse) => {
        setRawStage(d.stage);
        setData(normalize(d));
      })
      .catch((e) =>
        setError(`Failed to load draft (${e?.message || "unknown"})`)
      )
      .finally(() => setLoading(false));
  }, [apiKey, draft_id]);

  const nextTool = NEXT_TOOL_BY_STAGE[rawStage];

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href="/account"
        className="text-xs text-muted underline-offset-4 hover:underline"
      >
        ← My account
      </Link>

      {loading && <p className="mt-6 text-sm text-muted">Loading draft…</p>}
      {error && (
        <div className="mt-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {data && (
        <>
          <header className="mt-3 mb-6">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl tracking-tight">{data.ticker}</h1>
              <span className="text-xs uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Draft
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              Stage:{" "}
              <code className="text-[11px]">
                {rawStage.toLowerCase().replace(/_/g, " ")}
              </code>
              {nextTool && (
                <>
                  {" "}
                  · Next tool to call in your AI client:{" "}
                  <code className="text-[11px]">{nextTool}</code>
                </>
              )}
            </p>
            <p className="text-[11px] text-muted mt-1 font-mono">
              draft_id: {draft_id}
            </p>
          </header>
          <FrameworkView data={data} />
        </>
      )}
    </main>
  );
}

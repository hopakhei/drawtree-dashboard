"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FrameworkView, { FrameworkData } from "../../_components/FrameworkView";
import ErrorBoundary from "../../_components/ErrorBoundary";

const API_URL = "https://drawtree-api.onrender.com";

type TreeResponse = {
  tree_id: string;
  ticker: string;
  company?: string;
  visibility: string;
  draft_id: string | null;
  committed_at: string | null;
  payload: any;
  verdict: any;
};

function normalizeTreePayload(t: TreeResponse, draftEvidence?: Record<string, Record<string, any[]>>): FrameworkData {
  const p = t.payload || {};
  return {
    ticker: t.ticker,
    company: t.company,
    visibility: t.visibility,
    committed_at: t.committed_at,
    h0: p.h0
      ? { text: typeof p.h0 === "string" ? p.h0 : p.h0.text, metadata: p.h0.metadata }
      : p.root_hypothesis
      ? { text: p.root_hypothesis }
      : null,
    branches: (p.branches || []).map((b: any) => ({
      ...b,
      leaves: (b.leaves || []).map((l: any) => ({
        ...l,
        evidence:
          draftEvidence?.[b.id]?.[l.id] ??
          (Array.isArray(l.evidence) ? l.evidence : []),
      })),
    })),
    mece_rationale: p.mece_rationale,
    scenarios: p.scenarios,
    narrative: p.narrative ? { payload: p.narrative } : null,
    verdict: t.verdict?.h0_verdict || t.verdict?.verdict || t.verdict,
  };
}

export default function TreePage({
  params,
}: {
  params: { tree_id: string };
}) {
  const { tree_id } = params;
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [data, setData] = useState<FrameworkData | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
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

  async function loadAll() {
    if (!apiKey) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/v1/view/trees/by-id/${tree_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error(`${r.status}`);
      const t: TreeResponse = await r.json();
      setDraftId(t.draft_id);

      // If a source draft exists, fetch it so the tree viewer can use the
      // draft's enriched evidence (which is mutable) instead of the
      // immutable tree.payload snapshot. This lets 'Refresh from web'
      // and 'Add citation' affect what the user sees here.
      let draftEvidence: Record<string, Record<string, any[]>> | undefined;
      if (t.draft_id) {
        try {
          const rd = await fetch(
            `${API_URL}/v1/account/draft/${t.draft_id}`,
            { headers: { Authorization: `Bearer ${apiKey}` } },
          );
          if (rd.ok) {
            const d = await rd.json();
            const map: Record<string, Record<string, any[]>> = {};
            for (const [branchId, blob] of Object.entries(
              (d.leaves_by_branch || {}) as Record<string, any>,
            )) {
              const enrichedList = Array.isArray(blob?.enriched) ? blob.enriched : [];
              map[branchId] = {};
              for (const e of enrichedList) {
                if (e?.leaf_id && Array.isArray(e?.evidence)) {
                  map[branchId][e.leaf_id] = e.evidence;
                }
              }
            }
            draftEvidence = map;
          }
        } catch {}
      }
      setData(normalizeTreePayload(t, draftEvidence));
    } catch (e: any) {
      setError(`Failed to load tree (${e?.message || "unknown"})`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, tree_id]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href="/account"
        className="text-xs text-muted underline-offset-4 hover:underline"
      >
        ← My account
      </Link>

      {loading && <p className="mt-6 text-sm text-muted">Loading tree…</p>}
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
              <span className="text-xs uppercase tracking-wider text-muted">
                {data.visibility}
              </span>
            </div>
            {data.committed_at && (
              <p className="text-xs text-muted mt-1">
                Committed {new Date(data.committed_at).toLocaleDateString()}
              </p>
            )}
            <p className="text-[11px] text-muted mt-2 font-mono">
              tree_id: {tree_id}
            </p>
          </header>
          {draftId && (
            <div className="mb-5 text-xs text-muted bg-paper border border-line rounded px-3 py-2">
              You can refresh or add evidence on any leaf below. Edits attach
              to the source draft, so the next time you re-commit this tree
              the new evidence will be baked in.
            </div>
          )}
          <ErrorBoundary label="Tree viewer">
            <FrameworkView
              data={data}
              draftId={draftId || undefined}
              editable={!!draftId}
              apiUrl={API_URL}
              apiKey={apiKey || undefined}
              onChanged={() => loadAll()}
            />
          </ErrorBoundary>
        </>
      )}
    </main>
  );
}

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
  committed_at: string | null;
  payload: any;
  verdict: any;
};

function normalizeTreePayload(t: TreeResponse): FrameworkData {
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
    branches: p.branches || [],
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
    fetch(`${API_URL}/v1/view/trees/by-id/${tree_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((t) => setData(normalizeTreePayload(t)))
      .catch((e) => setError(`Failed to load tree (${e?.message || "unknown"})`))
      .finally(() => setLoading(false));
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
          <ErrorBoundary label="Tree viewer">
            <FrameworkView data={data} />
          </ErrorBoundary>
        </>
      )}
    </main>
  );
}

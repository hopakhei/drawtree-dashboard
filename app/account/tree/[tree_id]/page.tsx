"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FrameworkView, { FrameworkData } from "../../_components/FrameworkView";
import ErrorBoundary from "../../_components/ErrorBoundary";
import { useI18n } from "@/lib/i18n/LocaleProvider";

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
      ? {
          text: typeof p.h0 === "string" ? p.h0 : p.h0.text,
          metadata: p.h0.metadata,
          // Pass through the conviction pack written by
          // compute_root_conviction so FrameworkView can render the
          // root-level badge under H-0.
          conviction: typeof p.h0 === "object" ? p.h0.conviction : undefined,
        }
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

// Monitoring cadence editor card. Reads current value from
// /v1/account/draft/{draft_id} (which exposes `monitoring_cadence`),
// posts changes to /v1/drafts/set_phase2_notification which is the
// canonical write path for cc_emails + cadence.
function MonitorCadenceCard({
  apiUrl,
  apiKey,
  draftId,
  initialCadence,
  initialCcEmails,
  onSaved,
}: {
  apiUrl: string;
  apiKey: string;
  draftId: string;
  initialCadence: string;
  initialCcEmails: string[];
  onSaved?: () => void;
}) {
  const { m } = useI18n();
  const [cadence, setCadence] = useState(initialCadence || "none");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Re-sync local state if the parent reloads with a new value.
  useEffect(() => {
    setCadence(initialCadence || "none");
  }, [initialCadence]);

  const cadenceLabel: Record<string, string> = {
    daily: m.tree.cadenceDaily,
    weekly: m.tree.cadenceWeekly,
    none: m.tree.cadenceOff,
  };
  const cadenceCost: Record<string, string> = {
    daily: m.tree.costDaily,
    weekly: m.tree.costWeekly,
    none: m.tree.costNone,
  };

  async function save(next: string) {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(`${apiUrl}/v1/drafts/set_phase2_notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          draft_id: draftId,
          cc_emails: initialCcEmails,  // preserve existing CC list
          monitoring_cadence: next,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`${r.status}: ${txt.slice(0, 200)}`);
      }
      setCadence(next);
      setEditing(false);
      onSaved?.();
    } catch (e: any) {
      setErr(e?.message || m.tree.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-5 border border-line rounded p-4 bg-paper/40">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-xs uppercase tracking-wider text-muted">
          {m.tree.monitoringFrequency}
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-muted hover:underline"
          >
            {m.common.edit}
          </button>
        )}
      </div>
      {!editing ? (
        <div className="mt-1">
          <div className="text-sm">{cadenceLabel[cadence] || cadence}</div>
          <div className="text-[11px] text-muted mt-0.5">{cadenceCost[cadence] || ""}</div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-2">
            {["daily", "weekly", "none"].map((opt) => (
              <button
                key={opt}
                disabled={saving}
                onClick={() => save(opt)}
                className={`text-xs px-3 py-1.5 rounded border transition ${
                  cadence === opt
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-line text-muted hover:bg-line/30"
                }`}
              >
                {cadenceLabel[opt]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditing(false);
                setErr(null);
              }}
              className="text-xs text-muted hover:underline"
              disabled={saving}
            >
              {m.common.cancel}
            </button>
            {saving && <span className="text-xs text-muted">{m.common.saving}</span>}
          </div>
          {err && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
              {err}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TreePage({
  params,
}: {
  params: { tree_id: string };
}) {
  const { tree_id } = params;
  const { m, locale } = useI18n();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [data, setData] = useState<FrameworkData | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [cadence, setCadence] = useState<string>("none");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const k = sessionStorage.getItem("drawtree_api_key");
      if (k) setApiKey(k);
      else {
        setError(m.tree.notSignedIn);
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
            // Pick up monitoring preferences so the cadence card has
            // the current value to display and CC list to preserve on
            // save.
            if (typeof d.monitoring_cadence === "string") {
              setCadence(d.monitoring_cadence);
            }
            if (Array.isArray(d.cc_emails)) {
              setCcEmails(d.cc_emails);
            }
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
      setError(m.tree.loadFailed(e?.message || "unknown"));
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
        {m.common.backToAccount}
      </Link>

      {loading && <p className="mt-6 text-sm text-muted">{m.tree.loadingTree}</p>}
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
                {m.tree.committedOn(
                  new Date(data.committed_at).toLocaleDateString(m.common.dateLocale),
                )}
              </p>
            )}
            <p className="text-[11px] text-muted mt-2 font-mono">
              tree_id: {tree_id}
            </p>
          </header>
          {draftId && apiKey && (
            <MonitorCadenceCard
              apiUrl={API_URL}
              apiKey={apiKey}
              draftId={draftId}
              initialCadence={cadence}
              initialCcEmails={ccEmails}
              onSaved={loadAll}
            />
          )}
          {draftId && (
            <div className="mb-5 text-xs text-muted bg-paper border border-line rounded px-3 py-2">
              {m.tree.evidenceNote}
            </div>
          )}
          <ErrorBoundary
            label={m.tree.viewerLabel}
            errorTitle={m.errorBoundary.hitAnError}
            tryAgainLabel={m.errorBoundary.tryAgain}
          >
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

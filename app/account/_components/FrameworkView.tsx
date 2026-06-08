"use client";

import { useState } from "react";

// Shared renderer that takes a normalized Draw Tree framework (assembled
// either from /v1/account/draft/{id} or /v1/trees/{id}/payload) and shows
// it as a collapsible interactive view: H-0 → branches → leaves → scenarios.
//
// Every block is optional — early-stage drafts will only have narrative
// + H-0, while committed trees will have all five.

// Conviction pack written by the API's compute_root_conviction / per-branch
// helper. Both the root (h0.conviction) and each branch (branch.conviction)
// carry the same shape, with optional label_zh + badge for localized display.
export type ConvictionPack = {
  score?: number;            // [0, 1]
  label?: string;            // e.g. "High conviction"
  label_zh?: string;         // e.g. "高信心"
  badge?: string;            // emoji glyph, e.g. "🔥"
  weight?: number;           // branch weight (only on branch pack)
  // gain / expected fields only live on the root pack via scenarios.expected
};

export type Branch = {
  id: string;
  caption?: string;
  label?: string;
  core_question?: string;
  framework?: {
    name?: string;
    primary?: string;
    supporting?: string[];
    rationale?: string;
    from?: string;
    to?: string;
  };
  weight?: number;
  order?: number;
  leaves?: Leaf[]; // present on committed-tree payload, not on draft branches block
  conviction?: ConvictionPack;
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
  // Conviction-weighted expected price (set by the conviction engine after
  // every monitor run / commit). The dashboard surfaces this above the
  // Bear/Base/Bull tiers so the reader sees the headline number.
  expected?: {
    score?: number;          // root conviction in [0, 1]
    label?: string;
    label_zh?: string;
    badge?: string;
    value?: number;          // expected $ price
    gain_pct?: number;       // vs current_price
    current_price?: number;
    anchored_at?: { bear?: number | null; base?: number | null; bull?: number | null };
  };
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
    conviction?: ConvictionPack;
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

// Map emoji-prefixed verdict strings (e.g. "⚪ Inconclusive",
// "✅ Validated", "✗ Falsified") and plain labels into our state keys.
const EMOJI_TO_STATE: Record<string, string> = {
  "✅": "validated",
  "🟢": "trending_positive",
  "⚪": "inconclusive",
  "🟠": "trending_negative",
  "🟡": "approaching_falsification",
  "✗": "falsified",
  "❌": "falsified",
};

function normalizeVerdictKey(raw: string): string {
  const s = raw.trim();
  // Look for an emoji prefix first — works for both "✅" alone and "✅ Validated".
  for (const [emoji, state] of Object.entries(EMOJI_TO_STATE)) {
    if (s.startsWith(emoji)) return state;
  }
  return s.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function extractVerdictString(verdict: any): string {
  if (!verdict) return "";
  if (typeof verdict === "string") return verdict;
  if (typeof verdict === "object") {
    return String(
      verdict.label ||
        verdict.verdict ||
        verdict.state ||
        verdict.h0_verdict ||
        "",
    );
  }
  return "";
}

// Map a conviction score [0,1] to a Tailwind palette mirroring the badge
// tones used by the API helper (_conviction.score_to_label).
function convictionTone(score?: number): string {
  if (typeof score !== "number") return "text-muted bg-paper border-line";
  if (score >= 0.75) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 0.55) return "text-emerald-600 bg-emerald-50/60 border-emerald-200";
  if (score >= 0.45) return "text-muted bg-paper border-line";
  if (score >= 0.25) return "text-orange-700 bg-orange-50 border-orange-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function ConvictionBadge({
  pack,
  compact = false,
}: {
  pack?: ConvictionPack;
  compact?: boolean;
}) {
  if (!pack || typeof pack.score !== "number") return null;
  const tone = convictionTone(pack.score);
  const pct = Math.round(pack.score * 100);
  const glyph = pack.badge || "";
  const label = pack.label || "Conviction";
  if (compact) {
    return (
      <span className={`text-[11px] px-1.5 py-0.5 rounded border ${tone}`}>
        {glyph} {pct}%
      </span>
    );
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${tone}`}>
      {glyph} {label} · {pct}%
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict?: any }) {
  const raw = extractVerdictString(verdict);
  if (!raw) return null;
  const key = normalizeVerdictKey(raw);
  const m = VERDICT_BADGE[key];
  if (!m) {
    return (
      <span className="text-xs px-2 py-0.5 rounded border border-line text-muted">
        {raw.slice(0, 40)}
      </span>
    );
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
}

// Pull a leaf's verdict from the multiple shapes we've persisted historically.
function getLeafVerdict(leaf: Leaf): any {
  const l = leaf as any;
  return (
    l.verdict ??
    l.verdict_initial ??
    l.latest_verdict ??
    l.verdict_state ??
    null
  );
}

// Aggregate counts of verdict states across a branch's leaves so we can show
// a 2/0/3/... summary chip at the branch header.
function summarizeBranchVerdicts(leaves: Leaf[]): { state: string; count: number; label: string; icon: string }[] {
  const counts: Record<string, number> = {};
  for (const l of leaves) {
    const raw = extractVerdictString(getLeafVerdict(l));
    if (!raw) {
      counts["inconclusive"] = (counts["inconclusive"] || 0) + 1;
      continue;
    }
    const key = normalizeVerdictKey(raw);
    if (VERDICT_BADGE[key]) {
      counts[key] = (counts[key] || 0) + 1;
    } else {
      counts["inconclusive"] = (counts["inconclusive"] || 0) + 1;
    }
  }
  // Preserve a consistent display order matching the 6-state vocab.
  const order = [
    "validated",
    "trending_positive",
    "inconclusive",
    "trending_negative",
    "approaching_falsification",
    "falsified",
  ];
  return order
    .filter((k) => counts[k])
    .map((k) => ({
      state: k,
      count: counts[k],
      label: VERDICT_BADGE[k].label,
      icon: VERDICT_BADGE[k].icon,
    }));
}

function LeafCard({
  leaf,
  branchId,
  draftId,
  editable,
  apiUrl,
  apiKey,
  onChanged,
}: {
  leaf: Leaf;
  branchId?: string;
  draftId?: string;
  editable?: boolean;
  apiUrl?: string;
  apiKey?: string;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState<null | string>(null);
  const [editorErr, setEditorErr] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualSnippet, setManualSnippet] = useState("");
  const [showManual, setShowManual] = useState(false);
  const evidenceArr = Array.isArray((leaf as any).evidence) ? (leaf as any).evidence : [];

  const canEdit = editable && draftId && branchId && leaf.id && apiUrl && apiKey;

  async function appendManual() {
    if (!canEdit || !manualUrl.trim()) return;
    setBusy("manual");
    setEditorErr(null);
    try {
      const r = await fetch(`${apiUrl}/v1/account/leaf/append_evidence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          draft_id: draftId,
          branch_id: branchId,
          leaf_id: leaf.id,
          evidence: [
            {
              url: manualUrl.trim(),
              title: manualTitle.trim() || undefined,
              snippet: manualSnippet.trim() || undefined,
            },
          ],
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.detail?.code || `${r.status}`);
      }
      setManualUrl("");
      setManualTitle("");
      setManualSnippet("");
      onChanged?.();
    } catch (e: any) {
      setEditorErr(`Add failed: ${e?.message || "unknown"}`);
    } finally {
      setBusy(null);
    }
  }

  async function autoEvidence() {
    if (!canEdit) return;
    setBusy("auto");
    setEditorErr(null);
    // Sanitize the key — sessionStorage can occasionally pick up trailing
    // whitespace / newlines when users paste it; any non-ASCII or CR/LF in
    // an HTTP header value makes the browser throw TypeError: Failed to
    // fetch before the request is even sent.
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey) {
      setEditorErr("Not signed in. Open /account and sign in first.");
      setBusy(null);
      return;
    }
    // Pre-flight diagnostic: cheap GET to /v1/billing/balance. This separates
    // "network/CORS is broken" (Failed to fetch on the cheap call too) from
    // "the auto_evidence call itself failed" (cheap call succeeds, the
    // expensive one fails). It also wakes the Render instance if it's cold.
    try {
      const ping = await fetch(`${apiUrl}/v1/billing/balance`, {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });
      if (ping.status === 401) {
        setEditorErr(
          "Session expired. Open /account and sign in again with a new magic link.",
        );
        setBusy(null);
        return;
      }
      if (!ping.ok && ping.status !== 402) {
        setEditorErr(`Pre-flight check failed (HTTP ${ping.status}). The server may be in a bad state — try again in 30s.`);
        setBusy(null);
        return;
      }
    } catch (pingErr: any) {
      setEditorErr(
        `Can't reach the API server at all (${pingErr?.message || "network error"}). The Render instance may be asleep — wait 15s and try again.`,
      );
      setBusy(null);
      return;
    }
    // Auto-fetch runs up to 5 parallel Tavily queries on a Render free
    // instance — a cold-start round-trip can take 45-60s. Give it 120s
    // (we already pre-flighted to wake the instance).
    // We also retry once on transient network failure since Render
    // sometimes drops the first connection right after the pre-flight wake-up.
    async function attempt(): Promise<Response> {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 120_000);
      try {
        return await fetch(`${apiUrl}/v1/paid/auto_evidence`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cleanKey}`,
          },
          body: JSON.stringify({
            draft_id: draftId,
            branch_id: branchId,
            leaf_id: leaf.id,
          }),
          signal: ac.signal,
        });
      } finally {
        clearTimeout(t);
      }
    }
    try {
      let r: Response;
      try {
        r = await attempt();
      } catch (firstErr: any) {
        if (firstErr?.name === "AbortError") throw firstErr;
        // brief pause to let any half-open connection close, then retry once
        await new Promise((res) => setTimeout(res, 2000));
        r = await attempt();
      }
      if (r.status === 401) {
        setEditorErr(
          "Session expired. Please sign in again from the account page.",
        );
        return;
      }
      if (r.status === 402) {
        setEditorErr(
          "Not enough credits. Top up from the account page.",
        );
        return;
      }
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        const code = d?.detail?.code || d?.detail || d?.code;
        throw new Error(typeof code === "string" ? code : `HTTP ${r.status}`);
      }
      const d = await r.json();
      if (d.ok === false) {
        setEditorErr(
          "No public coverage found yet. Try adding a citation manually below.",
        );
      }
      onChanged?.();
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setEditorErr(
          "Search took too long (>120s). Try again — the search may have actually succeeded server-side; refresh to check.",
        );
      } else if (e?.message === "Failed to fetch" || e?.name === "TypeError") {
        setEditorErr(
          "The server dropped the connection twice. The Render free instance may have crashed — wait 30s and try again. If this keeps happening, the search is timing out server-side; try manual citation entry below.",
        );
      } else {
        setEditorErr(`Fetch failed: ${e?.message || "unknown"}`);
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteUrl(url: string) {
    if (!canEdit) return;
    if (!confirm("Remove this evidence row?")) return;
    setBusy("delete");
    setEditorErr(null);
    try {
      const r = await fetch(`${apiUrl}/v1/account/leaf/delete_evidence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          draft_id: draftId,
          branch_id: branchId,
          leaf_id: leaf.id,
          url,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.detail?.code || `${r.status}`);
      }
      onChanged?.();
    } catch (e: any) {
      setEditorErr(`Delete failed: ${e?.message || "unknown"}`);
    } finally {
      setBusy(null);
    }
  }
  const f = (leaf && leaf.falsification) || {};
  const fHuman =
    f.metric || f.operator || f.threshold !== undefined
      ? `${f.metric ?? "?"} ${f.operator ?? ""} ${f.threshold ?? ""}${f.window ? ` (${f.window})` : ""}`
      : null;
  const dataPoints = Array.isArray((leaf as any).data_points) ? (leaf as any).data_points : [];
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
        <VerdictBadge verdict={getLeafVerdict(leaf)} />
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-line text-sm space-y-2 bg-paper">
          {leaf.hypothesis && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">假設</div>
              <div>{leaf.hypothesis}</div>
            </div>
          )}
          {dataPoints.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">數據</div>
              <ul className="list-disc list-inside text-sm space-y-0.5">
                {dataPoints.slice(0, 8).map((d: any, i: number) => (
                  <li key={i}>
                    {typeof d === "string"
                      ? d
                      : d && typeof d === "object" && d.label
                      ? `${d.label}: ${d.value ?? ""}`
                      : JSON.stringify(d)}
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
          {/* Evidence list with edit affordances */}
          {(evidenceArr.length > 0 || canEdit) && (
            <div className="pt-2 mt-2 border-t border-line">
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1 flex items-center justify-between">
                <span>證據 · evidence ({evidenceArr.length})</span>
                {canEdit && (
                  <button
                    onClick={() => setEditorOpen((v) => !v)}
                    className="text-[11px] underline-offset-2 hover:underline normal-case font-normal"
                  >
                    {editorOpen ? "Close" : "+ Add / refresh"}
                  </button>
                )}
              </div>
              {evidenceArr.length === 0 && (
                <div className="text-xs text-muted italic">
                  No evidence rows yet.
                </div>
              )}
              <ul className="space-y-1">
                {evidenceArr.slice(0, 12).map((e: any, i: number) => (
                  <li key={e?.url || i} className="text-xs">
                    {e?.title && <div className="font-medium">{e.title}</div>}
                    {e?.snippet && (
                      <div className="text-muted line-clamp-2">{e.snippet}</div>
                    )}
                    <div className="text-[10px] text-muted flex items-center gap-2 flex-wrap">
                      {e?.source_domain && <span>{e.source_domain}</span>}
                      {e?.published_date && <span>· {e.published_date}</span>}
                      {e?.url && (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          source ↗
                        </a>
                      )}
                      {canEdit && e?.url && (
                        <button
                          onClick={() => deleteUrl(e.url)}
                          disabled={busy === "delete"}
                          className="text-red-700 hover:underline ml-auto disabled:opacity-50"
                        >
                          remove
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {editorOpen && canEdit && (
                <div className="mt-3 border border-line rounded p-3 bg-paper/60 space-y-3">
                  <div>
                    <button
                      onClick={autoEvidence}
                      disabled={busy === "auto"}
                      className="w-full px-3 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
                    >
                      {busy === "auto"
                        ? "Fetching evidence…"
                        : "✨ Auto-fetch evidence (2 credits)"}
                    </button>
                    <p className="text-[11px] text-muted mt-1.5">
                      Searches across public earnings transcripts, news, and
                      sell-side coverage based on this leaf's hypothesis and
                      metric. Results are sanitized and attached automatically.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-line">
                    <button
                      onClick={() => setShowManual((v) => !v)}
                      className="text-[11px] text-muted underline-offset-2 hover:underline"
                    >
                      {showManual
                        ? "− Hide manual entry"
                        : "+ Add a specific citation by hand"}
                    </button>
                  </div>
                  {showManual && (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2 py-1 text-xs border border-line rounded"
                      />
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="Title (optional)"
                        className="w-full px-2 py-1 text-xs border border-line rounded"
                      />
                      <textarea
                        value={manualSnippet}
                        onChange={(e) => setManualSnippet(e.target.value)}
                        placeholder="Snippet / quote (optional)"
                        rows={2}
                        className="w-full px-2 py-1 text-xs border border-line rounded"
                      />
                      <button
                        onClick={appendManual}
                        disabled={busy === "manual" || !manualUrl.trim()}
                        className="px-3 py-1 text-xs border border-line rounded hover:bg-line/40 disabled:opacity-50"
                      >
                        {busy === "manual" ? "Adding…" : "Add citation"}
                      </button>
                    </div>
                  )}
                  {editorErr && (
                    <div className="text-xs text-red-700">{editorErr}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function BranchSection({
  branch,
  leaves,
  draftId,
  editable,
  apiUrl,
  apiKey,
  onChanged,
}: {
  branch: Branch;
  leaves: Leaf[];
  draftId?: string;
  editable?: boolean;
  apiUrl?: string;
  apiKey?: string;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const label = branch.caption || branch.label || branch.id;
  const branchSummary = summarizeBranchVerdicts(leaves);
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
          {(branch.framework?.primary || branch.framework?.name) && (
            <div className="text-[11px] text-muted mt-0.5">
              Framework:{" "}
              <code>{branch.framework.primary || branch.framework.name}</code>
              {Array.isArray(branch.framework.supporting) &&
                branch.framework.supporting.length > 0 && (
                  <>
                    {" + "}
                    {branch.framework.supporting.map((s: string, i: number) => (
                      <code key={s} className="ml-0.5">
                        {i > 0 ? ", " : ""}{s}
                      </code>
                    ))}
                  </>
                )}
            </div>
          )}
          {(branchSummary.length > 0 || branch.conviction) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {branchSummary.map((s) => (
                <span
                  key={s.state}
                  className={`text-[11px] px-1.5 py-0.5 rounded border ${
                    VERDICT_BADGE[s.state]?.color || "text-muted border-line"
                  }`}
                >
                  {s.icon} {s.count}
                </span>
              ))}
              {branch.conviction && <ConvictionBadge pack={branch.conviction} compact />}
              {typeof branch.weight === "number" && (
                <span className="text-[11px] px-1.5 py-0.5 rounded border text-muted border-line">
                  weight {Math.round(branch.weight * 100)}%
                </span>
              )}
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
            <LeafCard
              key={l.id || i}
              leaf={l}
              branchId={branch.id}
              draftId={draftId}
              editable={editable}
              apiUrl={apiUrl}
              apiKey={apiKey}
              onChanged={onChanged}
            />
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
  // scenarios may legitimately be {} or have non-dict bull/base/bear. Guard.
  const safe = (scenarios as any) || {};
  const pick = (k: string) => {
    const v = safe[k];
    return v && typeof v === "object" ? v : null;
  };
  const tiers = [
    { key: "bull", label: "Bull", icon: "🐂", data: pick("bull") },
    { key: "base", label: "Base", icon: "🐃", data: pick("base") },
    { key: "bear", label: "Bear", icon: "🐻", data: pick("bear") },
  ];
  const hasAny = tiers.some(
    (t) => t.data && (t.data.value !== undefined || t.data.pct !== undefined)
  );
  if (!hasAny) {
    return (
      <div className="text-sm text-muted">
        Scenarios scaffolded but not yet computed.{scenarios.method ? ` Method: ${scenarios.method}.` : ""}
      </div>
    );
  }
  // Conviction-weighted expected price block. Lives on scenarios.expected
  // (written by compute_root_conviction → piecewise linear to bear/base/bull).
  // We render it ABOVE the Bull/Base/Bear tiers so the reader's eye lands
  // on the headline number first.
  const expected = (safe.expected || null) as Scenarios["expected"];
  return (
    <div className="space-y-2">
      {expected && typeof expected.value === "number" && (
        <div className="border border-line rounded p-3 bg-paper/40">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-sm">
              <span className="mr-2">🎯</span>
              <span className="font-medium">Expected (conviction-weighted)</span>
              <span className="ml-2">${expected.value}</span>
            </div>
            {typeof expected.gain_pct === "number" && (
              <span
                className={`text-xs ${
                  expected.gain_pct > 0
                    ? "text-emerald-700"
                    : expected.gain_pct < 0
                    ? "text-red-700"
                    : "text-muted"
                }`}
              >
                {expected.gain_pct > 0 ? "+" : ""}
                {expected.gain_pct.toFixed(1)}%
              </span>
            )}
          </div>
          {(expected.label || typeof expected.score === "number") && (
            <div className="text-[11px] text-muted mt-1">
              {expected.badge || ""} {expected.label || "Conviction"}
              {typeof expected.score === "number" && (
                <> · {Math.round(expected.score * 100)}% root conviction</>
              )}
            </div>
          )}
        </div>
      )}
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
              {pct !== undefined && pct !== null && (
                <span
                  className={`text-xs ${
                    typeof pct === "number"
                      ? pct > 0
                        ? "text-emerald-700"
                        : pct < 0
                        ? "text-red-700"
                        : "text-muted"
                      : "text-muted"
                  }`}
                >
                  {typeof pct === "number"
                    ? `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`
                    : String(pct)}
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

export default function FrameworkView({
  data,
  draftId,
  editable,
  apiUrl,
  apiKey,
  onChanged,
}: {
  data: FrameworkData;
  draftId?: string;
  editable?: boolean;
  apiUrl?: string;
  apiKey?: string;
  onChanged?: () => void;
}) {
  const branches = Array.isArray(data?.branches) ? data.branches : [];
  const leavesByBranch =
    data?.leaves_by_branch && typeof data.leaves_by_branch === "object"
      ? data.leaves_by_branch
      : {};
  const narrative =
    data?.narrative && typeof data.narrative === "object"
      ? (data.narrative as any).payload || null
      : null;
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
        {(data.verdict || data.h0?.conviction) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {data.verdict && <VerdictBadge verdict={data.verdict} />}
            {data.h0?.conviction && <ConvictionBadge pack={data.h0.conviction} />}
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
            {branches.map((b, idx) => {
              const id = b?.id || `branch-${idx}`;
              const treeLeaves = Array.isArray((b as any)?.leaves) ? (b as any).leaves : null;
              const draftLeaves =
                leavesByBranch[id] && Array.isArray((leavesByBranch[id] as any).leaves)
                  ? (leavesByBranch[id] as any).leaves
                  : null;
              const leaves = treeLeaves || draftLeaves || [];
              return (
                <BranchSection
                  key={id}
                  branch={{ ...b, id }}
                  leaves={leaves}
                  draftId={draftId}
                  editable={editable}
                  apiUrl={apiUrl}
                  apiKey={apiKey}
                  onChanged={onChanged}
                />
              );
            })}
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

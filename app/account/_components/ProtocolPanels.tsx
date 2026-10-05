"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

// Protocol v0.3 panels for a committed tree: the signed head version, the
// weekly-monitor status (rules gate, rejected proposals, condition events),
// the two valuation decisions, and the append-only version history with
// point-in-time and diff reads. Everything here is read-only.

const VERDICT_ZH: Record<string, string> = {
  validated: "已驗證",
  trending_positive: "趨向正面",
  inconclusive: "未定",
  trending_negative: "趨向負面",
  approaching_falsification: "接近證偽",
  falsified: "已證偽",
};
const VERDICT_ICON: Record<string, string> = {
  validated: "✅",
  trending_positive: "🟢",
  inconclusive: "⚪",
  trending_negative: "🟡",
  approaching_falsification: "🟠",
  falsified: "✗",
};

function hintOf(raw: any): string {
  const s = String(raw || "").trim();
  for (const [k, icon] of Object.entries(VERDICT_ICON)) {
    if (s.startsWith(icon)) return k;
  }
  return s.toLowerCase().replace(/\s+/g, "_");
}

export function verdictLabel(raw: any, locale: string): string {
  const k = hintOf(raw);
  const icon = VERDICT_ICON[k] || "";
  const text = locale === "zh" ? VERDICT_ZH[k] || String(raw || "") : k.replace(/_/g, " ");
  return `${icon} ${text}`.trim();
}

function fmtWhen(iso: any, dateLocale: string): string {
  if (!iso) return "—";
  try {
    return new Date(String(iso)).toLocaleString(dateLocale);
  } catch {
    return String(iso);
  }
}

async function getJson(url: string, apiKey: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    const code = d?.detail?.code || d?.detail || `HTTP ${r.status}`;
    throw new Error(typeof code === "string" ? code : `HTTP ${r.status}`);
  }
  return r.json();
}

// ---------------------------------------------------------------- head version

export function SignedVersionBadge({ version }: { version: any }) {
  const { m } = useI18n();
  if (!version || typeof version !== "object") return null;
  const env = version.key_kind === "env";
  const src = (m.protocol.sources as any)[String(version.source || "")] || version.source || "";
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
      <span
        className={`px-2 py-0.5 rounded border ${
          env
            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
            : "text-amber-700 bg-amber-50 border-amber-200"
        }`}
      >
        {env ? m.protocol.signedOperator : m.protocol.signedDev}
      </span>
      {version.version_hash && (
        <span className="font-mono text-muted">
          {m.protocol.versionLabel} {String(version.version_hash).slice(0, 12)}
        </span>
      )}
      {version.recorded_at && (
        <span className="text-muted">
          · {m.protocol.recordedAt} {fmtWhen(version.recorded_at, m.common.dateLocale)}
          {src ? ` · ${src}` : ""}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- weekly monitor

export function MonitorStatusCard({ payload }: { payload: any }) {
  const { m, locale } = useI18n();
  const run = payload?.scenarios?.last_monitor_run;
  const branches: any[] = Array.isArray(payload?.branches) ? payload.branches : [];
  const rejected: any[] = [];
  const tierTotals: Record<string, number> = {};
  const events: string[] = [];
  for (const b of branches) {
    for (const l of (b?.leaves || []) as any[]) {
      if (l?.monitor_rejected_change) rejected.push({ leaf_id: l.id, ...l.monitor_rejected_change });
      const tc = l?.monitor_source_tier_counts;
      if (tc && typeof tc === "object") {
        for (const [k, v] of Object.entries(tc)) tierTotals[k] = (tierTotals[k] || 0) + Number(v || 0);
      }
      for (const c of (l?.conditions || []) as any[]) {
        if (c && typeof c === "object" && c.status && c.status !== "open") {
          const st = (m.protocol.conditionStatus as any)[String(c.status)] || c.status;
          events.push(`${l.id} · ${c.cid || ""} ${st}`);
        }
      }
    }
  }
  if (!run && rejected.length === 0 && events.length === 0) return null;
  return (
    <section className="mb-5 border border-line rounded p-4 bg-paper/40">
      <div className="text-xs uppercase tracking-wider text-muted">{m.protocol.monitorTitle}</div>
      {run ? (
        <div className="mt-1 text-sm">
          <span>
            {m.protocol.lastRun} {fmtWhen(run.ran_at, m.common.dateLocale)}
          </span>
          <span className="text-muted text-xs">
            {" "}
            · {m.protocol.engine} {run.engine || "—"}
          </span>
          <div className="text-xs text-muted mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <span>{m.protocol.leavesProcessed(Number(run.leaves_processed || 0))}</span>
            <span>{m.protocol.changes(Number(run.verdict_changes || 0))}</span>
            {run.rejected_changes !== undefined && (
              <span>{m.protocol.rejected(Number(run.rejected_changes || 0))}</span>
            )}
            {run.condition_events !== undefined && (
              <span>{m.protocol.conditionEvents(Number(run.condition_events || 0))}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted">{m.protocol.noRunYet}</div>
      )}
      {Object.keys(tierTotals).length > 0 && (
        <div className="mt-2 text-[11px] text-muted">
          {m.protocol.sourceTiers}:{" "}
          {Object.entries(tierTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${(m.protocol.tierNames as any)[k] || k} ${v}`)
            .join(" · ")}
        </div>
      )}
      {rejected.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider text-muted">{m.protocol.rejectedTitle}</div>
          <ul className="mt-1 space-y-1 text-xs">
            {rejected.slice(0, 12).map((r, i) => (
              <li key={i} className="border border-line rounded px-2 py-1 bg-paper">
                <span className="font-medium mr-2">{r.leaf_id}</span>
                {m.protocol.rejectedLine(verdictLabel(r.proposed, locale), verdictLabel(r.kept, locale))}
                <span className="text-muted">
                  {" "}
                  · {m.protocol.rule} <code className="text-[10px]">{r.reason}</code>
                </span>
                {r.judge_reason && (
                  <div className="text-muted mt-0.5 line-clamp-2">{r.judge_reason}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {events.length > 0 && (
        <div className="mt-3 text-xs">
          <div className="text-[11px] uppercase tracking-wider text-muted">{m.protocol.conditions}</div>
          <div className="text-muted mt-1">{events.slice(0, 12).join(" · ")}</div>
        </div>
      )}
      <p className="text-[11px] text-muted mt-3">{m.protocol.monitorNote}</p>
    </section>
  );
}

// ---------------------------------------------------------------- two decisions

export function ValuationDecisionsCard({
  apiUrl,
  apiKey,
  draftId,
}: {
  apiUrl: string;
  apiKey: string;
  draftId: string;
}) {
  const { m } = useI18n();
  const [row, setRow] = useState<any | null | undefined>(undefined);
  const [showReport, setShowReport] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson(`${apiUrl}/v1/valuation/drafts/${draftId}`, apiKey)
      .then((d) => {
        if (!cancelled) setRow(d && d.decisions ? d : null);
      })
      .catch((e: any) => {
        if (cancelled) return;
        const msg = String(e?.message || "");
        if (/404|NOT_FOUND|NO_REPORT/i.test(msg)) setRow(null);
        else {
          setRow(null);
          setErr(msg);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, apiKey, draftId]);

  if (row === undefined) return null;
  if (row === null) {
    return (
      <section className="mb-5 border border-line rounded p-4 bg-paper/40">
        <div className="text-xs uppercase tracking-wider text-muted">{m.protocol.valuationTitle}</div>
        <div className="mt-1 text-xs text-muted">{err ? m.protocol.failed(err) : m.protocol.valuationNotReported}</div>
      </section>
    );
  }
  const dec = row.decisions || {};
  const ratios = dec.ratios || {};
  const tiers = dec.tiers || {};
  const gate = row.gate || {};
  const errors: any[] = Array.isArray(gate.errors) ? gate.errors : [];
  const val = row.valuation || {};
  const scen = val.scenarios || {};
  const approval = row.approval || null;
  const price = Number(val.snapshot_price || dec.price || 0) || null;
  return (
    <section className="mb-5 border border-line rounded p-4 bg-paper/40">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-xs uppercase tracking-wider text-muted">{m.protocol.valuationTitle}</div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded border ${
            row.ok
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-red-700 bg-red-50 border-red-200"
          }`}
        >
          {row.ok ? m.protocol.gateOk : m.protocol.gateErrors(errors.length)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted">{m.protocol.ratios}</div>
          <div className="tabular-nums">
            bear {ratios.bear != null ? Number(ratios.bear).toFixed(2) : "—"} · base 1.00 · bull{" "}
            {ratios.bull != null ? Number(ratios.bull).toFixed(2) : "—"}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted">{m.protocol.tiers}</div>
          <div className="text-xs">
            {(["bear", "base", "bull"] as const).map((k) => (
              <div key={k}>
                <span className="text-muted">{(m.protocol.targets as any)[k]}:</span>{" "}
                {tiers?.[k]?.identity || "—"}
              </div>
            ))}
          </div>
        </div>
      </div>
      {(scen.bear || scen.base || scen.bull) && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {(["bear", "base", "bull"] as const).map((k) => {
            const tp = Number(scen?.[k]?.target_price);
            const pct = price && tp ? ((tp / price - 1) * 100).toFixed(1) : null;
            return (
              <div key={k} className="border border-line rounded px-3 py-2 bg-paper">
                <div className="text-[11px] uppercase tracking-wider text-muted">{(m.protocol.targets as any)[k]}</div>
                <div className="tabular-nums">{isFinite(tp) && tp ? tp.toFixed(2) : "—"}</div>
                {pct && <div className="text-[11px] text-muted tabular-nums">{Number(pct) >= 0 ? "+" : ""}{pct}%</div>}
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 text-xs text-muted">
        {approval
          ? m.protocol.approvedBy(String(approval.approved_by || "—"), fmtWhen(row.approved_at, m.common.dateLocale))
          : m.protocol.notApproved}
      </div>
      {errors.length > 0 && (
        <ul className="mt-2 text-xs text-red-700 list-disc list-inside">
          {errors.slice(0, 8).map((e: any, i: number) => (
            <li key={i}>{typeof e === "string" ? e : JSON.stringify(e)}</li>
          ))}
        </ul>
      )}
      {row.report_md && (
        <div className="mt-3">
          <button
            onClick={() => setShowReport((v) => !v)}
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            {showReport ? m.protocol.hideReport : m.protocol.showReport}
          </button>
          {showReport && (
            <pre className="mt-2 text-[11px] whitespace-pre-wrap break-words border border-line rounded p-3 bg-paper max-h-96 overflow-auto">
              {row.report_md}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- versions

function leafVerdictMap(payload: any): { id: string; verdict: string }[] {
  const out: { id: string; verdict: string }[] = [];
  for (const b of (payload?.branches || []) as any[]) {
    for (const l of (b?.leaves || []) as any[]) {
      if (l?.id) out.push({ id: l.id, verdict: l.verdict_initial || l.verdict_hint || l.verdict || "" });
    }
  }
  return out;
}

export function VersionsPanel({
  apiUrl,
  apiKey,
  treeId,
}: {
  apiUrl: string;
  apiKey: string;
  treeId: string;
}) {
  const { m, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [at, setAt] = useState<string>("");
  const [stateAt, setStateAt] = useState<any | null | undefined>(undefined);
  const [fromV, setFromV] = useState<string>("");
  const [toV, setToV] = useState<string>("");
  const [diff, setDiff] = useState<any | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open || versions) return;
    getJson(`${apiUrl}/v1/view/trees/by-id/${treeId}/versions?limit=100`, apiKey)
      .then((d) => {
        const vs: any[] = Array.isArray(d?.versions) ? d.versions : [];
        setVersions(vs);
        if (vs.length >= 2) {
          setFromV(vs[1].version_id);
          setToV(vs[0].version_id);
        }
      })
      .catch((e: any) => setErr(String(e?.message || "error")));
  }, [open, versions, apiUrl, apiKey, treeId]);

  async function loadStateAt() {
    if (!at) return;
    setBusy("state");
    setStateAt(undefined);
    try {
      const iso = new Date(at).toISOString();
      const d = await getJson(`${apiUrl}/v1/view/trees/by-id/${treeId}/state_at?at=${encodeURIComponent(iso)}`, apiKey);
      setStateAt(d);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (/NO_VERSION_BEFORE_CUTOFF|404/i.test(msg)) setStateAt(null);
      else setErr(msg);
    } finally {
      setBusy(null);
    }
  }

  async function loadDiff() {
    if (!fromV || !toV || fromV === toV) return;
    setBusy("diff");
    setDiff(null);
    try {
      const d = await getJson(
        `${apiUrl}/v1/view/trees/by-id/${treeId}/versions/diff?from_version=${fromV}&to_version=${toV}`,
        apiKey,
      );
      setDiff(d);
    } catch (e: any) {
      setErr(String(e?.message || "error"));
    } finally {
      setBusy(null);
    }
  }

  const srcLabel = (s: any) => (m.protocol.sources as any)[String(s || "")] || s || "";

  return (
    <section className="mt-6 border border-line rounded p-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-muted">{m.protocol.versionsTitle}</span>
        <span className="text-xs text-muted">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-4 text-sm">
          <p className="text-[11px] text-muted">{m.protocol.versionsNote}</p>
          {err && <div className="text-xs text-red-700">{m.protocol.failed(err)}</div>}
          {!versions && !err && <div className="text-xs text-muted">{m.protocol.loading}</div>}
          {versions && versions.length === 0 && <div className="text-xs text-muted">{m.protocol.noVersions}</div>}
          {versions && versions.length > 0 && (
            <ul className="space-y-1 max-h-64 overflow-auto">
              {versions.map((v) => (
                <li key={v.version_id} className="text-xs flex flex-wrap items-baseline gap-x-2 border-b border-line/60 py-1">
                  <span className="text-muted tabular-nums">{fmtWhen(v.recorded_at, m.common.dateLocale)}</span>
                  <span>{srcLabel(v.source)}</span>
                  {v.actor && <span className="text-muted">· {v.actor}</span>}
                  <span className="font-mono text-muted">{String(v.version_hash || "").slice(0, 10)}</span>
                  <span className={`ml-auto ${v.key_kind === "env" ? "text-emerald-700" : "text-amber-700"}`}>
                    {v.key_kind === "env" ? "env" : v.key_kind || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-line pt-3">
            <div className="text-[11px] uppercase tracking-wider text-muted mb-1">{m.protocol.stateAt}</div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={at}
                onChange={(e) => setAt(e.target.value)}
                className="px-2 py-1 text-xs border border-line rounded"
              />
              <button
                onClick={loadStateAt}
                disabled={!at || busy === "state"}
                className="px-3 py-1 text-xs border border-line rounded hover:bg-line/40 disabled:opacity-50"
              >
                {m.protocol.stateAtGo}
              </button>
            </div>
            {stateAt === null && <div className="text-xs text-muted mt-2">{m.protocol.stateAtNone}</div>}
            {stateAt && (
              <div className="mt-2 text-xs">
                <div className="text-muted">
                  {m.protocol.stateAtResult(fmtWhen(stateAt.recorded_at, m.common.dateLocale), srcLabel(stateAt.source))}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted mt-2">{m.protocol.leafVerdictsAt}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {leafVerdictMap(stateAt.payload).map((x) => (
                    <span key={x.id} className="px-1.5 py-0.5 border border-line rounded bg-paper">
                      {x.id} {verdictLabel(x.verdict, locale)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {versions && versions.length >= 2 && (
            <div className="border-t border-line pt-3">
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">{m.protocol.diffTitle}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted">{m.protocol.diffFrom}</span>
                <select value={fromV} onChange={(e) => setFromV(e.target.value)} className="px-2 py-1 border border-line rounded max-w-[16rem]">
                  {versions.map((v) => (
                    <option key={v.version_id} value={v.version_id}>
                      {fmtWhen(v.recorded_at, m.common.dateLocale)} · {srcLabel(v.source)}
                    </option>
                  ))}
                </select>
                <span className="text-muted">{m.protocol.diffTo}</span>
                <select value={toV} onChange={(e) => setToV(e.target.value)} className="px-2 py-1 border border-line rounded max-w-[16rem]">
                  {versions.map((v) => (
                    <option key={v.version_id} value={v.version_id}>
                      {fmtWhen(v.recorded_at, m.common.dateLocale)} · {srcLabel(v.source)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadDiff}
                  disabled={!fromV || !toV || fromV === toV || busy === "diff"}
                  className="px-3 py-1 border border-line rounded hover:bg-line/40 disabled:opacity-50"
                >
                  {m.protocol.diffGo}
                </button>
              </div>
              {diff && (
                <div className="mt-2 text-xs">
                  <div className="text-muted">{m.protocol.diffChanges((diff.changes || []).length)}</div>
                  {(diff.changes || []).length === 0 && <div className="text-muted">{m.protocol.diffNone}</div>}
                  <ul className="mt-1 space-y-0.5 max-h-72 overflow-auto font-mono text-[11px]">
                    {(diff.changes || []).slice(0, 200).map((c: any, i: number) => (
                      <li key={i} className="break-all">
                        <span
                          className={
                            c.op === "added"
                              ? "text-emerald-700"
                              : c.op === "removed"
                              ? "text-red-700"
                              : "text-amber-700"
                          }
                        >
                          {c.op}
                        </span>{" "}
                        {c.path}
                        {c.op === "changed" && (
                          <span className="text-muted">
                            {" "}
                            {JSON.stringify(c.from)} → {JSON.stringify(c.to)}
                          </span>
                        )}
                        {c.op === "added" && <span className="text-muted"> {JSON.stringify(c.to)}</span>}
                        {c.op === "removed" && <span className="text-muted"> {JSON.stringify(c.from)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

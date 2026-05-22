import { readTree, verdictEmoji, verdictPill } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function TickerPage({ params }: { params: { ticker: string } }) {
  const t = await readTree(params.ticker.toUpperCase());
  if (!t) notFound();

  const a = t.aggregation;
  const tree = t.tree;
  const root = tree?.root || {};
  const consensus = tree?.consensus || {};
  const branches = tree?.branches || [];
  const hyps = tree?.hypotheses || [];
  const valuation = tree?.valuation;

  return (
    <main className="max-w-4xl mx-auto px-6 py-14">
      <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
        ← back
      </Link>

      <header className="mt-4 mb-10">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl tracking-tight">{t.ticker}</h1>
          <span className="text-muted text-sm">{tree?.company}</span>
        </div>
        <div className="mt-2 text-xs text-muted">
          published by <span className="text-ink">{t.agent_handle}</span> ·{" "}
          {new Date(t.received_at).toLocaleString("en-CA")} · version{" "}
          <span className="font-mono">{t.version_hash.slice(0, 12)}</span>
        </div>
      </header>

      {/* H-0 + conviction */}
      <section className="border border-line rounded p-6 mb-8">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-muted uppercase tracking-wider">H-0 verdict</div>
            <span
              className={`mt-2 inline-block px-3 py-1 rounded text-base ${verdictPill(a?.h0_verdict || "")}`}
            >
              {verdictEmoji(a?.h0_verdict || "")} {a?.h0_verdict || "—"}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted uppercase tracking-wider">Conviction</div>
            <div className="text-2xl tabular-nums">{a?.conviction?.toFixed(2) || "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted uppercase tracking-wider">Expected return</div>
            <div
              className={`text-2xl tabular-nums ${
                a?.expected_return == null
                  ? "text-muted"
                  : a.expected_return >= 0
                  ? "text-accent"
                  : "text-red-700"
              }`}
            >
              {a?.expected_return == null
                ? "—"
                : `${(a.expected_return * 100).toFixed(1)}%`}
            </div>
          </div>
        </div>
        {root.question && (
          <p className="mt-6 text-sm leading-relaxed">{root.question}</p>
        )}
        {root.core_thesis && (
          <p className="mt-2 text-sm text-muted leading-relaxed">{root.core_thesis}</p>
        )}
      </section>

      {/* Market consensus baseline */}
      {consensus.narrative && (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-wider text-muted mb-3">
            Frozen market consensus
          </h2>
          <p className="text-sm leading-relaxed">{consensus.narrative}</p>
          {consensus.implicit_assumptions?.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-sm text-muted">
              {consensus.implicit_assumptions.map((x: string, i: number) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Branches */}
      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted mb-3">Branches</h2>
        <div className="space-y-3">
          {branches.map((b: any) => {
            const aggB = a?.branches?.find((x: any) => x.id === b.id);
            return (
              <div key={b.id} className="border border-line rounded p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <span className="font-medium">{b.id}</span>{" "}
                    <span className="text-muted text-sm">{b.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted">w={aggB?.weight?.toFixed(1) || "—"}</span>
                    <span className="text-muted">score={aggB?.score?.toFixed(2) || "—"}</span>
                    <span
                      className={`px-2 py-0.5 rounded ${verdictPill(aggB?.verdict || "")}`}
                    >
                      {verdictEmoji(aggB?.verdict || "")} {aggB?.verdict || "—"}
                    </span>
                  </div>
                </div>
                {b.summary && <p className="mt-2 text-sm text-muted">{b.summary}</p>}
                <ul className="mt-3 space-y-1">
                  {hyps
                    .filter((h: any) => (h.parents || [h.id?.[0]]).includes(b.id))
                    .map((h: any) => (
                      <li key={h.id} className="text-sm flex items-baseline gap-2">
                        <span
                          className={`px-1.5 py-0 rounded text-xs ${verdictPill(h.verdict || "")}`}
                        >
                          {verdictEmoji(h.verdict || "")}
                        </span>
                        <span className="font-medium">{h.id}</span>
                        <span className="text-muted truncate">{h.title}</span>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Valuation */}
      {valuation?.scenarios && (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-wider text-muted mb-3">Valuation</h2>
          <div className="grid grid-cols-3 gap-3">
            {(["bull", "base", "bear"] as const).map((k) => {
              const s = valuation.scenarios[k];
              if (!s) return null;
              const sp = valuation.snapshot_price;
              const dist = sp ? ((s.target_price - sp) / sp) * 100 : null;
              const prob = a?.scenario_probabilities?.[k];
              return (
                <div key={k} className="border border-line rounded p-4">
                  <div className="text-xs uppercase text-muted">{k}</div>
                  <div className="text-xl tabular-nums mt-1">
                    {s.target_price?.toFixed(0)}
                  </div>
                  {dist !== null && (
                    <div
                      className={`text-xs tabular-nums ${
                        dist >= 0 ? "text-accent" : "text-red-700"
                      }`}
                    >
                      {dist >= 0 ? "+" : ""}
                      {dist.toFixed(1)}% vs spot
                    </div>
                  )}
                  {prob != null && (
                    <div className="text-xs text-muted mt-1">
                      P = {(prob * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Falsifications quick view */}
      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted mb-3">
          Kill conditions ({hyps.reduce((n: number, h: any) => n + (h.falsification?.length || 0), 0)})
        </h2>
        <div className="space-y-1 text-xs">
          {hyps.map((h: any) =>
            (h.falsification || []).map((f: any, i: number) => {
              const text = typeof f === "string" ? f : f.text;
              const ftype = typeof f === "string" ? "observable?" : f.type;
              return (
                <div key={`${h.id}-${i}`} className="flex gap-2">
                  <span className="font-medium text-muted shrink-0 w-8">{h.id}</span>
                  <span
                    className={`shrink-0 px-1.5 py-0 rounded text-xs ${
                      ftype === "observable"
                        ? "bg-paper border border-line"
                        : "bg-ink/5 text-muted"
                    }`}
                  >
                    {ftype}
                  </span>
                  <span>{text}</span>
                </div>
              );
            })
          )}
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-line text-xs text-muted">
        Signed Ed25519 · server pubkey at{" "}
        <Link href="/api/server-pubkey" className="underline">
          /api/server-pubkey
        </Link>
      </footer>
    </main>
  );
}

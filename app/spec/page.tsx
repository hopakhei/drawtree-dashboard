import Link from "next/link";

export const metadata = {
  title: "Draw Tree Protocol v0.3 — drawtree.capital",
  description:
    "The protocol behind Draw Tree: impact-graded hypothesis trees, structured falsification conditions, rule-bound valuation (two decisions), a weekly judge with an evidence gate, and append-only signed versions.",
};

const MCP_REPO = "https://github.com/hopakhei/drawtree-mcp";
const API_REPO = "https://github.com/hopakhei/drawtree-api";

export default function SpecPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      {/* -------------------------------------------------------- */}
      {/* Header                                                   */}
      {/* -------------------------------------------------------- */}
      <header className="mb-12">
        <div className="text-xs text-muted uppercase tracking-wider">
          Protocol · v0.3 (2026-10-05)
        </div>
        <h1 className="text-3xl tracking-tight mt-2">
          The Draw Tree Protocol
        </h1>
        <p className="text-muted mt-4 leading-relaxed text-sm">
          A protocol for AI-native equity research. It defines what a
          falsifiable hypothesis tree is, how its branch weights are
          derived from valuation impact, how valuation is reduced to two
          human decisions, how a weekly judge may and may not change a
          verdict, and how every write is recorded as a signed,
          append-only version. Any MCP-compatible client — ChatGPT,
          Claude.ai, Claude Desktop, Claude Code, Codex, Perplexity —
          can drive it.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Link
            href="/start"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Setup guide →
          </Link>
          <Link
            href="/signup"
            className="px-3 py-1.5 bg-ink text-paper rounded hover:opacity-90"
          >
            Try free
          </Link>
          <a
            href={`${MCP_REPO}/blob/main/docs/PROTOCOL_v0.3.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Spec ↗
          </a>
          <a
            href={MCP_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Kernel + MCP server ↗
          </a>
          <a
            href={`${API_REPO}/blob/main/docs/VALUATION_RULES.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Valuation rules ↗
          </a>
          <a
            href="https://drawtree-mcp.onrender.com/.well-known/oauth-protected-resource"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            OAuth metadata
          </a>
        </div>
      </header>

      {/* -------------------------------------------------------- */}
      {/* 0 · Protocol vs MCP                                       */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          0 · Protocol vs MCP — two different layers
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          <strong>MCP</strong> (Model Context Protocol) is a transport:
          how a client lists tools, calls one, and authenticates. It
          knows nothing about investment research. The{" "}
          <strong>Draw Tree Protocol</strong> is the domain contract:
          what a valid tree is, how verdicts aggregate, which valuation
          methods are admissible, what the weekly judge may do.
        </p>
        <div className="border border-line rounded overflow-hidden mt-4">
          <table className="w-full text-xs">
            <thead className="bg-paper-2 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Layer</th>
                <th className="px-3 py-2 font-medium">What it defines</th>
                <th className="px-3 py-2 font-medium">Where it lives</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">MCP</td>
                <td className="px-3 py-2">Transport, discovery, auth.</td>
                <td className="px-3 py-2">drawtree-mcp (hosted and stdio)</td>
              </tr>
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">Protocol kernel</td>
                <td className="px-3 py-2">Schema, validator, aggregator, condition sweep, verdict-change gate, migration.</td>
                <td className="px-3 py-2">
                  <code>drawtree_mcp/_kernel</code> and <code>drawtree-api/core</code> — the same code
                </td>
              </tr>
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">State</td>
                <td className="px-3 py-2">Drafts, trees, versions, valuation decisions, subscriptions.</td>
                <td className="px-3 py-2">drawtree-api (FastAPI + Postgres)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 className="text-sm font-medium mt-6 mb-2">Why this protocol is open</h3>
        <p className="text-sm text-muted leading-relaxed">
          A tool that claims to bring scientific method to investment
          research cannot itself be a black box. The schema, the
          formulas, the rules the judge obeys and the client contract
          are all public and MIT-licensed. The kernel ships with a
          golden test: a real research tree from the maintainer&apos;s
          fleet aggregates to exactly the fleet engine&apos;s score,
          verdict, conviction and probabilities. If drawtree.capital
          disappears, committed trees remain readable against this
          spec.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 1 · Tree schema                                           */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">1 · The tree</h2>
        <pre className="bg-paper-2 border border-line rounded p-4 text-xs leading-relaxed overflow-x-auto">
{`Consensus   →  What the market believes and what the price already assumes.
H-0         →  One question, one question mark, ≤120 characters, naming the
               bear outcome ("…rather than being pushed back to …").
Branches    →  3–5 necessary conditions. Each carries an impact grade derived
               from what happens to the valuation if it fails.
Leaves      →  Observable questions with a six-level reading guide, structured
               conditions on disclosed numbers, an append-only evidence ledger.
Valuation   →  Three scenarios from two human decisions (rules R1–R12).`}
        </pre>
        <ul className="text-xs text-muted space-y-2 mt-5 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-ink">Branch weight is derived, not authored.</strong>{" "}
            Each branch declares a falsification consequence (where the
            scenario goes if the branch fails). The gate computes how far
            that moves the implied value as a share of price and assigns
            the grade: ≥25% 致命 (2.5), 10–25% 重創 (1.6), 4–10% 明顯受損
            (0.9), 1–4% 輕微 (0.4), &lt;1% 邊緣 (0.15). A branch whose weight
            differs from its derived grade fails validation. At least one
            branch must be fatal, and one must carry numerator delivery.
          </li>
          <li>
            <strong className="text-ink">Conditions are structured.</strong>{" "}
            <code>{`{cid, kind, metric, operator, threshold, unit, window, due, status}`}</code>{" "}
            with <code>kind</code> ∈ falsification / verification / deadline
            and <code>status</code> ∈ open / breached / met / superseded /
            expired_unfulfilled. Every condition is assessed at every
            judgement (gates E1–E7: no moved goalposts, no unaddressed
            breach, no unassessed condition, no unsupported downgrade).
          </li>
          <li>
            <strong className="text-ink">Evidence is a ledger.</strong>{" "}
            Rows are appended, never edited: <code>eid, date, text,
            source_name, url, tier, impact, bears_on</code>. Tier is
            filing &gt; earnings &gt; trade_press &gt; news &gt; synthetic;
            impact is supports / challenges / neutral.
          </li>
          <li>
            <strong className="text-ink">Reader fields</strong> sit next to
            the machine fields: a one-line <code>short_question</code>, a
            six-level <code>reading_guide</code>, and the reader block
            「現時判斷 → 甚麼會推翻這個假設 → 推翻之後」.
          </li>
        </ul>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 2 · Verdicts and aggregation                              */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">2 · Verdicts and aggregation</h2>
        <div className="border border-line rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-paper-2 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Verdict</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {[
                ["✅ Validated", "+2", "The reading guide's top level has been observed."],
                ["🟢 Trending positive", "+1", "Direction supports the leaf; threshold not yet reached."],
                ["⚪ Inconclusive", "0", "No decisive reading yet. The default for a new leaf."],
                ["🟡 Trending negative", "−1", "Direction works against the leaf."],
                ["🟠 Approaching falsification", "−2", "A listed condition is close; one more reading flips it."],
                ["✗ Falsified", "−3", "A listed condition was met, on a primary or wire source."],
              ].map(([v, s, mng]) => (
                <tr key={v} className="border-t border-line">
                  <td className="px-3 py-2 text-ink">{v}</td>
                  <td className="px-3 py-2 font-mono">{s}</td>
                  <td className="px-3 py-2">{mng}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="bg-paper-2 border border-line rounded p-4 text-xs leading-relaxed overflow-x-auto mt-4">
{`branch score    = weighted mean of leaf scores (leaf weights, default equal)
branch verdict  = thresholds ≥1.5 / ≥0.5 / >−0.5 / >−1.5; kill at ≤−2.0,
                  or when any leaf in necessity_leaves is Falsified
branch conviction = σ( logit(0.40) + 1.5 · score )
H-0 score       = impact-weighted mean of branch scores; kill at ≤−2.0
H-0 conviction  = σ( logit(0.40) + Σ w · score/3 ), positive terms halved,
                  clamped to [0.005, 0.95]
p_bull = h0/2, p_bear = −h0/3 (verdict-based); price-implied probabilities
                  from the three targets and the current price (Max-Base)`}
        </pre>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Both probability readings are model outputs on the author&apos;s
          targets, reported side by side. Neither is a calibrated
          probability, and the protocol never produces a weighted target
          price.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 3 · Valuation                                             */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">3 · Valuation — two decisions, rules R1–R12</h2>
        <pre className="bg-paper-2 border border-line rounded p-4 text-xs leading-relaxed overflow-x-auto">
{`numerator(scenario) = street consensus × ratio(scenario)   ratio(base) = 1
multiple(scenario)  = median of the scenario's peer tier, today
target(scenario)    = numerator × multiple           (per share)
                    = (numerator × multiple + net cash) ÷ diluted shares   (EV rulers)`}
        </pre>
        <p className="text-sm text-muted mt-4 leading-relaxed">
          The author decides only two things: the bear and bull ratios to
          consensus (each with a one-sentence economic reason, an anchor,
          sourced inputs, assumptions and a cross-check), and the bear and
          bull peer-tier identities. The base tier is the tier whose band
          contains the company&apos;s own multiple. Everything else is derived
          by the server, and the human approves the report before anything
          is committed.
        </p>
        <ul className="text-xs text-muted space-y-1.5 mt-4 leading-relaxed list-disc list-inside">
          <li><strong className="text-ink">R5</strong> hard gate: bear &lt; price &lt; bull. The only fix is the economics — never a shifted multiple.</li>
          <li><strong className="text-ink">R10 / AX7</strong> own multiple outside every band must be declared (base impure).</li>
          <li><strong className="text-ink">R12</strong> forward-table multiples are re-based to the stated close when the table&apos;s implied price is more than 2% away.</li>
          <li><strong className="text-ink">n-rules</strong> one peer needs an idiosyncrasy note; two use the midpoint with ratio ≤1.30; three or more use the median with max/min ≤2.5.</li>
          <li><strong className="text-ink">Banned</strong> DCF, reverse DCF, DDM, inverted scenarios, weighted target prices — rejected everywhere.</li>
        </ul>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Tools: <code>evaluate_valuation</code> (free, stateless),{" "}
          <code>report_two_decisions</code> (stores and returns the report),{" "}
          <code>approve_decisions</code> (records the reply verbatim and
          builds the schema-2.1 document the commit attaches).
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 4 · Procedure                                             */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">4 · Procedure — four steps, two human gates</h2>
        <pre className="bg-paper-2 border border-line rounded p-4 text-[11px] leading-relaxed overflow-x-auto">
{`1 RESEARCH   background brief (400–700 characters) · pricing pack · narrative
             start_draft → frame_narrative → save_narrative
2 BUILD      five questions → scenario ladder → H-0 → necessary-condition path
             frame_h0 → save_h0 → design_branches → fetch_framework_details
             → save_branches → design_leaves / save_leaves (per branch)
             preview_tree  ■ FRAMEWORK GATE — the human reads the framework
             confirm_framework
3 GATE       evaluate_valuation until no errors
             report_two_decisions  ■ TWO-DECISION GATE — the human replies
             approve_decisions(reply verbatim)
             research_phase2 → research_phase2_status → compute_scenarios
             commit_draft_tree  (validated, aggregated, signed, versioned)
4 REPORT     summarize_tree → reader report (§1 industry → company → why now;
             §2 what it sells / how it charges / where the money goes / last
             quarter; §3 consensus; §4 price chart with narrative bands)
             setup_monitoring?`}
        </pre>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          The client contract (the skill) enforces the gates: nothing
          downstream of <code>preview_tree</code> or{" "}
          <code>report_two_decisions</code> is called until the human
          answers in the conversation. Download it from{" "}
          <a href="/api/skill/skill.md" className="text-ink underline-offset-4 hover:underline">
            /api/skill/skill.md
          </a>
          .
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 5 · Weekly monitor                                        */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">5 · Weekly monitor — what the judge may do</h2>
        <pre className="bg-paper-2 border border-line rounded p-4 text-[11px] leading-relaxed overflow-x-auto">
{`sweep      deterministic: overdue deadlines expire, crossed thresholds breach and latch
search     broad + targeted; every result tagged source_tier
           (primary · wire · trade · aggregator · other)
judge      sees only the evidence pool, the standing verdict, the conditions
gate       a proposed change is kept only if it
             1  cites a URL that was in this week's pool
             1b–1c  cites verifiable rows with known ids
             1d  is not an upgrade on all-challenging (or downgrade on all-supporting) rows
             2  quotes a real listed condition when entering the falsification zone
             3  is not a price-only argument
             +  Falsified needs a primary or wire source
           otherwise the standing verdict is kept and the proposal is recorded
latch      met / breached / expired conditions cannot be assessed back to not_met;
           only "superseded" with a reason releases them
freshness  first_public graded 首發 / 補課 / 未能確認
write      append-only: ledger rows, verdict_history, conditions; a signed version`}
        </pre>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          A daily scheduler calls the API; weekly subscriptions run on
          Saturday 09:00 HKT. Rejected proposals and condition events are
          shown to the owner, in the email and on the tree page — nothing
          disappears silently.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 6 · Point in time                                         */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">6 · Point in time — signed, append-only versions</h2>
        <p className="text-sm text-muted leading-relaxed">
          Every write — commit, edit, weekly judgement, price refresh,
          narrative refresh — appends a <code>tree_versions</code> row:
          the full payload, <code>sha256(canonical_json)</code>, an
          Ed25519 signature by the operator key, and provenance
          (source, actor, previous version, protocol version,{" "}
          <code>key_kind</code>). Nothing is rewritten in place.
        </p>
        <pre className="bg-paper-2 border border-line rounded p-4 text-[11px] leading-relaxed overflow-x-auto mt-4">
{`GET /v1/view/trees/by-id/{id}/versions                 history, newest first
GET /v1/view/trees/by-id/{id}/versions/{version_id}    one version, with payload
GET /v1/view/trees/by-id/{id}/state_at?at=ISO          the tree as held at or before a cutoff
GET /v1/view/trees/by-id/{id}/versions/diff?from_version=&to_version=
GET /v1/server_pubkey                                  public key and key_kind`}
        </pre>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          <code>state_at</code> is the only read a backtest or a dispute may
          use. A version signed by a development key is marked{" "}
          <code>key_kind: dev</code> and is not an attestation.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 7 · Tool surface                                          */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">7 · The MCP tool surface</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-line rounded p-4">
            <div className="text-xs uppercase tracking-wider text-emerald-700 mb-2">Kernel · valuation gate · point in time (free)</div>
            <ul className="text-[11px] font-mono text-muted space-y-1 leading-relaxed">
              <li>validate_tree / aggregate_tree</li>
              <li>migrate_tree / sweep_conditions</li>
              <li>evaluate_valuation</li>
              <li>report_two_decisions / approve_decisions</li>
              <li>read_valuation_draft</li>
              <li>read_tree_versions / read_tree_version</li>
              <li>read_tree_state_at / diff_tree_versions</li>
              <li>commit_tree / read_tree / read_history</li>
              <li>suggest_framework</li>
            </ul>
          </div>
          <div className="border border-line rounded p-4">
            <div className="text-xs uppercase tracking-wider text-muted mb-2">Draft flow · view mode (hosted server)</div>
            <ul className="text-[11px] font-mono text-muted space-y-1 leading-relaxed">
              <li>start_draft → frame_* / save_* → preview_tree</li>
              <li>confirm_framework <span className="text-[10px]">(Phase 2 bundle)</span></li>
              <li>research_phase2 / research_phase2_status</li>
              <li>compute_scenarios / commit_draft_tree</li>
              <li>summarize_tree / read_committed_report</li>
              <li>my_workspace / list_my_drafts / list_my_trees</li>
              <li>read_branch / propose_edit / apply_edit</li>
              <li>setup_monitoring / pause / resume / cancel</li>
              <li>search / fetch <span className="text-[10px]">(ChatGPT-compat)</span></li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          The stdio server ships the kernel, the valuation gate, publish
          and point-in-time reads (20 tools). The hosted server adds the
          draft flow and view mode. Read-only and kernel tools never
          charge; the client never mentions credits — the balance is at{" "}
          <Link href="/account" className="underline-offset-4 hover:underline text-ink">/account</Link>.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 8 · Architecture                                          */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">8 · Architecture</h2>
        <pre className="bg-paper-2 border border-line rounded p-4 text-[10.5px] leading-relaxed overflow-x-auto">
{`┌──────────────┐  MCP (stdio / Streamable HTTP)  ┌──────────────────────────┐
│  AI client   │ ───────────────────────────────▶ │  drawtree-mcp (Render)   │
│ ChatGPT      │                                  │  kernel v0.3 · OAuth     │
│ Claude.ai    │                                  └────────────┬─────────────┘
│ Claude Code  │                                               │ REST, Bearer dt_…
│ Codex · …    │                                               ▼
└──────────────┘                                  ┌──────────────────────────┐
                                                  │  drawtree-api (Render)   │
                                                  │  core/ = same kernel     │
                                                  │  valuation R1–R12        │
                                                  │  weekly judge + gate     │
                                                  │  Ed25519 · tree_versions │
                                                  │  Postgres (Neon)         │
                                                  └──────┬─────────────┬─────┘
                                                         ▼             ▼
                                        ┌──────────────────┐  ┌──────────────────┐
                                        │ drawtree-dashboard│  │ daily scheduler  │
                                        │ (Vercel) reads    │  │ → admin_run_cron │
                                        │ the same API      │  │ (Saturday judge) │
                                        └──────────────────┘  └──────────────────┘`}
        </pre>
        <ul className="text-xs text-muted space-y-2 leading-relaxed list-disc list-inside mt-4">
          <li>The kernel is one codebase imported by both the MCP server and the API; a tree validates and aggregates identically on either side.</li>
          <li>The API owns all state and signing. Replacing the transport does not touch user data.</li>
          <li>The dashboard renders the same records the AI reads — including versions, the two-decision report and the judge&apos;s rejected proposals.</li>
        </ul>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 9 · Out of scope                                          */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">9 · What is not in the protocol</h2>
        <ul className="text-xs text-muted space-y-2 leading-relaxed list-disc list-inside">
          <li><strong className="text-ink">Recommendations.</strong> The protocol produces structured evidence, verdicts and scenario arithmetic. It never produces a position, a target price or advice.</li>
          <li><strong className="text-ink">DCF, reverse DCF, DDM, inverted scenarios.</strong> Rejected by the validator and the valuation gate.</li>
          <li><strong className="text-ink">A public directory.</strong> Trees are private by default; a public tree is the owner&apos;s explicit choice.</li>
          <li><strong className="text-ink">Model lock-in.</strong> Any model that can follow the skill&apos;s hard rules produces compliant trees; the kernel contains no model calls.</li>
        </ul>
      </section>

      {/* -------------------------------------------------------- */}
      {/* Footer                                                    */}
      {/* -------------------------------------------------------- */}
      <footer className="mt-16 pt-6 border-t border-line text-xs text-muted">
        <div className="flex flex-wrap justify-between gap-3">
          <span>Protocol v0.3 · last revised 2026-10-05</span>
          <div className="flex gap-4">
            <Link href="/" className="underline-offset-4 hover:underline">Home</Link>
            <Link href="/start" className="underline-offset-4 hover:underline">Setup guide</Link>
            <Link href="/account" className="underline-offset-4 hover:underline">My account</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

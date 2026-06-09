import Link from "next/link";

export const metadata = {
  title: "Draw Tree Protocol — drawtree.capital",
  description:
    "The wire protocol behind Draw Tree: a five-layer hypothesis-tree schema, a 38-tool MCP server, and a six-state verdict vocabulary that any AI client can drive.",
};

export default function SpecPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      {/* -------------------------------------------------------- */}
      {/* Header                                                   */}
      {/* -------------------------------------------------------- */}
      <header className="mb-12">
        <div className="text-xs text-muted uppercase tracking-wider">
          Protocol · v0.3 (2026-06)
        </div>
        <h1 className="text-3xl tracking-tight mt-2">
          The Draw Tree Protocol
        </h1>
        <p className="text-muted mt-4 leading-relaxed text-sm">
          A wire protocol for AI-native equity research. Defines how a
          hypothesis tree is structured, how it is co-designed step by
          step with the user, how it is researched in a single batched
          job, and how it is monitored week after week. Any
          MCP-compatible AI client — ChatGPT, Claude.ai, Perplexity,
          Claude Code, Codex, Claude Desktop — can drive it.
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
            href="https://github.com/Draw-Tree/drawtree-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Spec on GitHub ↗
          </a>
          <a
            href="https://github.com/Draw-Tree/drawtree-validator"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Validator ↗
          </a>
          <a
            href="https://github.com/Draw-Tree/drawtree-skill"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Skill ↗
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
      {/* 0 · Protocol vs MCP — the layering                       */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          0 · Protocol vs MCP — two different layers
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          A common point of confusion: <strong>MCP</strong> (Model
          Context Protocol) is a generic transport spec that lets any
          AI client talk to any tool server. It defines how to{" "}
          <code>tools/list</code>, how to call a tool, how OAuth works
          on the wire — it knows nothing about what the server
          actually does. The <strong>Draw Tree Protocol</strong> is a
          domain contract: what a valid investment hypothesis tree
          looks like, what verdict vocabulary it uses, how branch
          weights aggregate, what valuation methods are accepted.
        </p>
        <div className="border border-line rounded overflow-hidden mt-4">
          <table className="w-full text-xs">
            <thead className="bg-paper-2 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Layer</th>
                <th className="px-3 py-2 font-medium">What it defines</th>
                <th className="px-3 py-2 font-medium">Analogy</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">MCP</td>
                <td className="px-3 py-2">Transport, discovery, auth.</td>
                <td className="px-3 py-2">HTTP</td>
              </tr>
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">Draw Tree Protocol</td>
                <td className="px-3 py-2">Tree schema, verdict vocab, aggregation rules, validation invariants.</td>
                <td className="px-3 py-2">OpenAPI schema</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-4 leading-relaxed">
          You could in principle implement the Draw Tree Protocol over
          plain REST or gRPC and skip MCP entirely. You could equally
          host a completely different research methodology over MCP.
          Today we ship the protocol on MCP because that&apos;s the
          transport AI clients understand natively.
        </p>

        <h3 className="text-sm font-medium mt-6 mb-2">
          Why this protocol is open
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          A tool that claims to bring scientific method to investment
          research cannot itself be a black box. The whole point of
          scientific method, since Boyle and Hooke, has been that the
          procedure is public — the conclusions can be argued with,
          but only because the procedure can be inspected, repeated,
          and challenged by anyone.
        </p>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          So the Draw Tree Protocol — the tree schema, the verdict
          vocabulary, the aggregation rules, the validation
          invariants, the <code>SKILL.md</code> contract that
          governs how AI clients behave — belongs to whoever wants
          to use it. Anyone can read this page, implement a server,
          and produce trees that interoperate with the ones on
          drawtree.capital.
        </p>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          The full normative specification lives at{" "}
          <a
            href="https://github.com/Draw-Tree/drawtree-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline-offset-4 hover:underline"
          >
            github.com/Draw-Tree/drawtree-protocol
          </a>
          . A reference Python validator (<code>pip install
          drawtree-validator</code>) is at{" "}
          <a
            href="https://github.com/Draw-Tree/drawtree-validator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline-offset-4 hover:underline"
          >
            github.com/Draw-Tree/drawtree-validator
          </a>
          . The AI-client contract (SKILL.md / AGENTS.md / system
          prompt) is at{" "}
          <a
            href="https://github.com/Draw-Tree/drawtree-skill"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline-offset-4 hover:underline"
          >
            github.com/Draw-Tree/drawtree-skill
          </a>
          . All three are MIT-licensed.
        </p>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          If drawtree.capital ever disappears, the trees you have
          committed remain readable against this spec. Another team
          can re-implement the server without our cooperation. That
          is not a contingency plan — it is the property a protocol
          has to have for it to deserve being called a protocol.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 1 · The tree schema                                       */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          1 · The five-layer tree
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Every Draw Tree decomposes a single investment thesis into
          five strictly-ordered layers. Each layer answers one question
          and produces artefacts the next layer depends on.
        </p>
        <pre className="bg-paper-2 border border-line rounded p-4 text-xs leading-relaxed overflow-x-auto">
{`Narrative   →  What does the market believe? What do you disagree with?
H-0         →  One falsifiable sentence, with a time window.
Branches    →  3-4 MECE branches, each bound to one of 164 frameworks.
Leaves      →  2-4 sub-hypotheses per branch. Each has a kill condition.
Scenarios   →  Bull / Base / Bear. Peer group + multiple → implied price.`}
        </pre>
        <ul className="text-xs text-muted space-y-2 mt-5 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-ink">Narrative</strong> requires a
            written statement of the current market consensus plus the
            specific claim you are contesting. A tree whose thesis
            agrees with consensus has no edge and is flagged before
            commit.
          </li>
          <li>
            <strong className="text-ink">H-0</strong> must be a single
            sentence of the form &ldquo;within X months, Y will (or
            will not) happen&rdquo;. Generic sentiment statements are
            rejected at validation.
          </li>
          <li>
            <strong className="text-ink">Branches</strong> are
            MECE-checked and each binds to one of 164 indexed strategy
            frameworks (Porter Five Forces, Wide Moat, Unit Economics,
            Demand-Side Economics, …). The chosen framework drives what
            the Phase 2 research job actually searches for.
          </li>
          <li>
            <strong className="text-ink">Leaves</strong> are the unit
            of falsifiability. Every leaf must declare its kill
            condition — typed as <em>observable</em>,{" "}
            <em>directional</em>, or <em>mechanism</em>. Leaves without
            a kill condition fail validation and the tree cannot be
            committed.
          </li>
          <li>
            <strong className="text-ink">Scenarios</strong> use Peer
            Group Valuation: each scenario binds a peer set + a
            multiple method (EV/Sales, EV/EBITDA, P/E, P/FCF, SOTP).
            The server computes implied per-share value and its
            distance from the current price.{" "}
            <strong>DCF, reverse DCF, and DDM are not supported by
            design</strong>{" "}
            — they encode too much noise as precision.
          </li>
        </ul>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 2 · Verdict vocabulary                                   */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          2 · The six-state verdict vocabulary
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Every leaf, every branch, and the root H-0 carries a verdict
          on a six-state monotone scale. Aggregation rolls leaves up to
          branches (Fibonacci-default weights, overridable) and
          branches up to H-0 conviction in [0, 1].
        </p>
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
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">validated</td>
                <td className="px-3 py-2 font-mono">1.00</td>
                <td className="px-3 py-2">Evidence strongly confirms the hypothesis.</td>
              </tr>
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">trending_positive</td>
                <td className="px-3 py-2 font-mono">0.75</td>
                <td className="px-3 py-2">Directional support; threshold not yet hit.</td>
              </tr>
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">inconclusive</td>
                <td className="px-3 py-2 font-mono">0.50</td>
                <td className="px-3 py-2">Data insufficient or ambiguous. Default for un-researched leaves.</td>
              </tr>
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">trending_negative</td>
                <td className="px-3 py-2 font-mono">0.25</td>
                <td className="px-3 py-2">Directional pressure against the hypothesis.</td>
              </tr>
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">approaching_falsification</td>
                <td className="px-3 py-2 font-mono">0.10</td>
                <td className="px-3 py-2">One more disconfirming data point flips it.</td>
              </tr>
              <tr className="border-t border-line">
                <td className="px-3 py-2 font-mono text-ink">falsified</td>
                <td className="px-3 py-2 font-mono">0.00</td>
                <td className="px-3 py-2">Hypothesis disproven.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          The expected return on a tree is conviction-weighted:{" "}
          <code className="text-[11px]">Σ (scenario_prob × scenario_value_distance)</code>
          . The Phase 2 research job and the weekly cron both update
          verdicts using the same vocabulary, so a tree&apos;s history
          is always read on one consistent scale.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 3 · Phase 1 — step-by-step framework design              */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          3 · Phase 1 — framework design (free)
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Phase 1 is the protocol&apos;s most-enforced rule: the AI
          client must never chain stages. After each tool call it
          presents the result back to the user in plain language and
          asks whether to refine or proceed. <code>save_*</code> is
          only called after explicit user confirmation.
        </p>
        <pre className="bg-paper-2 border border-line rounded p-4 text-[11px] leading-relaxed overflow-x-auto">
{`start_draft(ticker)
  → confirm company name

frame_narrative(draft_id)
  → present market-narrative archaeology
  → user confirms
  → save_narrative

frame_h0(draft_id)
  → present H-0 sentence + framework_from / framework_to + window
  → user confirms
  → save_h0

design_branches(draft_id, target_branch_count=4)
  → read 164-framework one-liner index + top-15 scored shortlist
  → fetch_framework_details(names=[...6-12 candidates...])  (free, batched)
  → walk user through 3-4 MECE branches
  → user confirms
  → save_branches

design_leaves(branch_id='A')        ┐
  → render diagnostic axes          │  repeat per branch
  → user confirms                   │  until is_last_branch
  → propose 2-4 leaves + kill cond. │
  → save_leaves({A: [...]})         ┘

design_scenarios → save_scenarios
preview_tree    → confirm_framework`}
        </pre>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          The protocol exposes a separate{" "}
          <code>fetch_framework_details</code> tool because the
          framework-shortlisting step requires the AI to read multiple
          candidates&apos; full pitfalls + diagnostic axes before
          recommending one. Loading those is free and does not advance
          the draft stage.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 4 · Phase 2 — batched deep research                      */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          4 · Phase 2 — deep research (one button, one bundle)
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Once <code>confirm_framework</code> is called, the server
          holds a single flat <strong>50-credit Phase 2 bundle</strong>{" "}
          and kicks off a deep-research job covering every narrative
          pillar and every leaf&apos;s falsification metric in one
          shot.
        </p>
        <pre className="bg-paper-2 border border-line rounded p-4 text-[11px] leading-relaxed overflow-x-auto">
{`confirm_framework(draft_id)
  → 50 cr held as a single bundle (auto-confirms in 24h)

research_phase2(draft_id, model='pro')
  → server starts a long-running research job
  → returns immediately with poll_after_seconds

research_phase2_status(draft_id)   (poll every 30-60s)
  → status: queued | running | ingested | failed
  → typical wall time: 60-180s

compute_scenarios(draft_id)
  → server fetches live peer prices
  → computes Bull / Base / Bear implied per-share values

commit_draft_tree(draft_id, visibility='private')
  → publishes the tree, locks a version_hash

summarize_tree(tree_id)
  → renders the final 10-section report
  → asks once: "Set up weekly monitoring?"`}
        </pre>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          Splitting the work this way is deliberate. The{" "}
          <strong>design</strong> of a research framework wants to be
          slow, interactive, and reversible. The{" "}
          <strong>execution</strong> of that framework — the
          fact-gathering — wants to be fast, parallel, and batched.
          Mixing the two produces the worst of both worlds.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 5 · Weekly monitoring                                    */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          5 · Weekly monitoring
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          After a tree is committed the user is asked once whether to
          enable weekly monitoring. The server then provisions a
          per-ticker GitHub Actions cron that runs every Saturday
          morning HKT and:
        </p>
        <ul className="text-xs text-muted space-y-2 leading-relaxed list-disc list-inside">
          <li>
            Pulls the past week&apos;s news from public sources,
            deduplicated and quality-filtered by source.
          </li>
          <li>
            Attributes each article to specific branches and leaves it
            affects.
          </li>
          <li>
            Runs a two-pass hybrid verdict engine (evidence ingestion,
            then verdict re-evaluation), updating every leaf on the
            six-state vocabulary above.
          </li>
          <li>
            Writes the new evidence and verdict changes back as a new
            version of the same tree — history is append-only.
          </li>
          <li>
            Posts a structured update to the user&apos;s configured
            Slack channel (or email).
          </li>
        </ul>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          Monitoring is prepaid at <strong>5 credits per week per
          tree</strong>. <code>pause_monitoring</code>,{" "}
          <code>resume_monitoring</code>, and{" "}
          <code>cancel_monitoring</code> are free; cancelling refunds
          unused weeks pro-rata.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 6 · Tool surface                                         */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          6 · The MCP tool surface
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          The MCP server exposes 38 tools, grouped by phase. Free
          tools cover validation, reading, listing, and balance.
          Charged tools are explicitly labelled and use a
          hold-then-confirm credit model that auto-confirms in 24
          hours (refundable at <Link href="/account" className="underline-offset-4 hover:underline text-ink">/account</Link>).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-line rounded p-4">
            <div className="text-xs uppercase tracking-wider text-emerald-700 mb-2">
              Free
            </div>
            <ul className="text-[11px] font-mono text-muted space-y-1 leading-relaxed">
              <li>start_draft</li>
              <li>frame_narrative / save_narrative</li>
              <li>frame_h0 / save_h0</li>
              <li>design_branches / save_branches</li>
              <li>fetch_framework_details</li>
              <li>design_leaves / save_leaves</li>
              <li>design_scenarios / save_scenarios</li>
              <li>preview_tree</li>
              <li>validate_tree / aggregate_tree</li>
              <li>commit_tree / commit_draft_tree</li>
              <li>read_tree / read_tree_by_ticker</li>
              <li>read_branch / read_history</li>
              <li>summarize_tree / read_committed_report</li>
              <li>my_workspace / list_my_drafts / list_my_trees</li>
              <li>suggest_framework</li>
              <li>set_report_language / set_phase2_notification</li>
              <li>propose_edit / apply_edit / abandon_draft</li>
              <li>pause_monitoring / resume_monitoring / cancel_monitoring</li>
              <li>balance / credit_balance</li>
              <li>refund_charge</li>
              <li>search / fetch (ChatGPT-compat)</li>
            </ul>
          </div>
          <div className="border border-line rounded p-4">
            <div className="text-xs uppercase tracking-wider text-amber-700 mb-2">
              Charged (hold-then-confirm)
            </div>
            <ul className="text-[11px] font-mono text-muted space-y-1 leading-relaxed">
              <li>confirm_framework <span className="text-[10px]">(50 cr bundle)</span></li>
              <li>research_phase2 <span className="text-[10px]">(bundled)</span></li>
              <li>research_phase2_status <span className="text-[10px]">(free polling)</span></li>
              <li>compute_scenarios <span className="text-[10px]">(bundled)</span></li>
              <li>enrich_narrative_data <span className="text-[10px]">(bundled)</span></li>
              <li>enrich_leaf_data <span className="text-[10px]">(bundled)</span></li>
              <li>phase2_run_all <span className="text-[10px]">(bundled)</span></li>
              <li>enrich_branches <span className="text-[10px]">(per branch)</span></li>
              <li>register_narrative</li>
              <li>suggest_falsification</li>
              <li>derive_scenario_values</li>
              <li>auto_evidence <span className="text-[10px]">(2 cr)</span></li>
              <li>append_evidence</li>
              <li>external_search <span className="text-[10px]">(1 cr)</span></li>
              <li>subscribe_alerts <span className="text-[10px]">(per alert)</span></li>
              <li>setup_monitoring <span className="text-[10px]">(5 cr/week)</span></li>
              <li>confirm_charge <span className="text-[10px]">(early confirm)</span></li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          Polling tools like <code>research_phase2_status</code> never
          charge. Read-only tools never charge. The AI client is
          instructed by the skill never to mention credit costs to the
          user — they can check their own balance at{" "}
          <Link href="/account" className="underline-offset-4 hover:underline text-ink">/account</Link>.
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 7 · Architecture                                         */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          7 · Architecture
        </h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Draw Tree runs as four independent services. The MCP server
          owns the protocol surface; the API owns all state; the
          dashboard renders the same data the AI sees; the cron runs
          background research without going through MCP transport.
        </p>
        <pre className="bg-paper-2 border border-line rounded p-4 text-[10.5px] leading-relaxed overflow-x-auto">
{`┌──────────────┐    MCP (Streamable HTTP)    ┌──────────────────┐
│  AI client   │ ──────────────────────────▶ │  drawtree-mcp    │
│ ChatGPT      │ ◀────────────────────────── │  (FastMCP, OAuth │
│ Claude.ai    │                              │   2.1 + PKCE,    │
│ Perplexity   │                              │   dt_ Bearer)    │
│ Claude Code  │                              └────────┬─────────┘
│ Codex CLI    │                                       │ REST
│ Claude Desk. │                                       ▼
└──────────────┘                              ┌──────────────────┐
                                              │  drawtree-api    │
                                              │  (FastAPI + Neon │
                                              │   Postgres)      │
                                              └────────┬─────────┘
                                ┌──────────────────────┼──────────────────────┐
                                ▼                      ▼                      ▼
                       ┌────────────────┐    ┌──────────────────┐    ┌──────────────┐
                       │ drawtree-      │    │ GitHub Actions   │    │ deep-research│
                       │ dashboard      │    │ weekly cron      │    │ + verdict    │
                       │ (Next.js,      │    │ (one per tree)   │    │ judge        │
                       │  drawtree.     │    └──────────────────┘    └──────────────┘
                       │  capital)      │
                       └────────────────┘`}
        </pre>
        <h3 className="text-sm font-medium mt-6 mb-2">
          Why split MCP from API
        </h3>
        <ul className="text-xs text-muted space-y-2 leading-relaxed list-disc list-inside">
          <li>
            <code>drawtree-mcp</code> only handles protocol: validation,
            aggregation, tool routing, OAuth discovery. It is stateless
            and trivially redeployable.
          </li>
          <li>
            <code>drawtree-api</code> owns all state: trees, drafts,
            charges, subscriptions, monitoring jobs. Replacing the MCP
            transport does not touch user data.
          </li>
          <li>
            The dashboard hits the same API. What you see at{" "}
            <code>drawtree.capital</code> and what the AI sees through
            MCP are always one source of truth.
          </li>
          <li>
            The weekly cron talks to the API directly, not through MCP
            — background jobs should not be constrained by the
            transport limits of a synchronous tool call.
          </li>
        </ul>

        <h3 className="text-sm font-medium mt-6 mb-2">
          Why MCP and not function calling
        </h3>
        <ul className="text-xs text-muted space-y-2 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-ink">Discovery is standard.</strong>{" "}
            Clients call <code>tools/list</code> and render schemas on
            their own. Adding a new tool requires no client change.
          </li>
          <li>
            <strong className="text-ink">Streamable HTTP transport.</strong>{" "}
            Long-running jobs (Phase 2 research, 60–180 s) can stream
            intermediate progress over SSE.
          </li>
          <li>
            <strong className="text-ink">Two auth paths, one server.</strong>{" "}
            CLI clients send <code>Authorization: Bearer dt_…</code>;
            web clients use OAuth 2.1 with PKCE and Dynamic Client
            Registration. Both hit the same tools.
          </li>
        </ul>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 8 · Skill — the client contract                          */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          8 · The skill — protocol contract on the client side
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The server defines what tools exist. The shipped{" "}
          <code>SKILL.md</code> defines{" "}
          <strong>how AI clients must use them</strong>: the entry
          gate, the Phase 1 stage ordering, batched-vs-sequential
          rules, error fallback order, and wording rules (never mention
          credits, preserve the user&apos;s terminology, add an open
          question when sources conflict).
        </p>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          The same skill ships in three wrappers — Anthropic Skills
          format (Claude Code, Claude Desktop, Claude.ai), AGENTS.md
          (Codex CLI), and a system-prompt body (ChatGPT, Perplexity).
          Behaviour is identical across clients because the protocol
          enforces it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <a
            href="/api/skill/skill.md"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Download SKILL.md
          </a>
          <a
            href="/api/skill/agents.md"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Download AGENTS.md
          </a>
          <a
            href="/api/skill/skill.zip"
            className="px-3 py-1.5 border border-line rounded hover:bg-line/40"
          >
            Download skill.zip
          </a>
        </div>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 9 · Versioning                                            */}
      {/* -------------------------------------------------------- */}
      <section className="mb-12">
        <h2 className="text-xl tracking-tight mb-3">
          9 · Versioning and what is not in the protocol
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Every commit produces a content-addressed{" "}
          <code>version_hash</code>. Editing any leaf forks a new
          version; nothing is ever overwritten. A six-month-old tree
          and today&apos;s tree on the same ticker are directly
          comparable.
        </p>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          Some things are intentionally out of scope:
        </p>
        <ul className="text-xs text-muted space-y-2 leading-relaxed list-disc list-inside mt-2">
          <li>
            <strong className="text-ink">DCF, reverse DCF, DDM,
            inverted scenarios.</strong>{" "}
            These methods encode noise as precision and conflict with
            the falsifiability requirement.
          </li>
          <li>
            <strong className="text-ink">Public directory of trees.</strong>{" "}
            All committed trees are private by default. There is no
            search across users or tickers.
          </li>
          <li>
            <strong className="text-ink">Model lock-in.</strong>{" "}
            The protocol does not prescribe which LLM the client uses.
            Any model that can read <code>SKILL.md</code> and follow
            its hard rules produces compliant trees.
          </li>
        </ul>
      </section>

      {/* -------------------------------------------------------- */}
      {/* Footer                                                    */}
      {/* -------------------------------------------------------- */}
      <footer className="mt-16 pt-6 border-t border-line text-xs text-muted">
        <div className="flex flex-wrap justify-between gap-3">
          <span>Protocol v0.3 · last revised 2026-06</span>
          <div className="flex gap-4">
            <Link href="/" className="underline-offset-4 hover:underline">
              Home
            </Link>
            <Link href="/start" className="underline-offset-4 hover:underline">
              Setup guide
            </Link>
            <Link href="/account" className="underline-offset-4 hover:underline">
              My account
            </Link>
            <a
              href="mailto:founder@peter-ai.app"
              className="underline-offset-4 hover:underline"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

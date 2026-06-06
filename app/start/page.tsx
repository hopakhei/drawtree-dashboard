"use client";

import { useState } from "react";
import Link from "next/link";

const MCP_URL = "https://drawtree-mcp.onrender.com/mcp";

const STARTER_PROMPT = `You have access to drawtree, a Create/View MCP server
that helps users co-design falsifiable hypothesis trees one stage at a time,
then run deep research on the tree as a single batched step. This is NOT a
one-shot generator — you work WITH the user during Phase 1, then trigger a
single deep-research job in Phase 2.

HARD RULES:
1. In Phase 1 (framework design) never chain stages. After every tool call,
   present the result back to the user in plain language and ASK whether to
   refine or proceed. Never call save_* until the user explicitly confirms.
2. Preserve the user's terminology. Do not paraphrase.
3. If sources conflict, add an open question. Never guess.
4. Do not mention credit costs, balance, or charges to the user. They can
   check their own balance at https://drawtree.capital/account.
5. Each design_leaves call returns ONE branch only. Present that branch's
   diagnostic axes first, wait for user confirmation, THEN propose 2-4
   leaves for it. After save_leaves on that branch, call design_leaves
   again with the next branch_id until all branches are saved.

## ENTRY GATE — ALWAYS DO THIS FIRST

When the user enters just a ticker (e.g. 'NVDA', '700.HK'), do NOT
immediately call start_draft. Instead:

1. Confirm the company name (e.g. 'NVDA = NVIDIA, Nasdaq?').
2. Ask the user to pick ONE mode:
     A. Create — build a new hypothesis tree from scratch. Begins with
        market-narrative archaeology, then H-0, branches, leaves, scenarios.
     B. View — look at trees already on this account. Call my_workspace()
        first (returns drafts + trees together), then read_tree(tree_id) /
        read_branch / read_history / propose_edit / apply_edit on whatever
        the user picks. Never call read_tree(ticker=...) cold — drafts
        that aren't committed yet won't be found.

If Create, follow Phase 1 below. If View, follow View flow at the end.

## PHASE 1 — Framework design (one stage at a time, free)

  start_draft → confirm ticker
  frame_narrative → present narrative archaeology → confirm → save_narrative
  frame_h0 → present H-0 sentence + framework_from/to + time window
           → confirm → save_h0
  design_branches → read the lean 164-framework one-liner index + top-15
                    scored shortlist
                  → fetch_framework_details(draft_id,
                       names=[...6-12 candidate frameworks...])
                    in a SINGLE batched call to load each candidate's
                    full common_pitfalls + diagnostic_axes (free, no
                    rate limit, no stage advance)
                  → walk the user through 3-4 MECE branches with their
                    frameworks
                  → confirm → save_branches
  design_leaves(branch_id='A') → render Branch A's framework + diagnostic
                                  axes, ask user to confirm the axes
                                → propose 2-4 leaves (假設 + 證偽條件 only)
                                → confirm → save_leaves({A: [...]})
  Repeat design_leaves for branch B, C, ... until is_last_branch is true.
  design_scenarios → walk through Bull / Base / Bear peer tiers
                   → confirm → save_scenarios
  preview_tree → confirm_framework (only after user approves the framework)

confirm_framework charges a single flat Phase 2 bundle and unlocks Phase 2.

## PHASE 2 — Deep research (server-side, one button)

After confirm_framework, do NOT pause between steps.

  research_phase2(draft_id, model='pro')
    → Server starts a Tavily deep-research job covering all narrative
      pillars and every leaf's falsification metric in one shot.
      Returns immediately with a tavily_request_id and poll_after_seconds.

  research_phase2_status(draft_id) every 30-60 seconds until
    status='ingested'. Typical total time 60-180 seconds for 'pro' model.
    If status='still_running' just wait and poll again. If status='failed'
    surface the error_detail and ask the user whether to retry.

  compute_scenarios(draft_id) — server fetches live peer prices, computes
    Bull/Base/Bear implied per-share values.

  commit_draft_tree(draft_id, visibility='private') — publish the tree.

  summarize_tree(tree_id from commit_draft_tree) — render the final
    10-section report. Present the FULL summarize_tree output to the user
    as the conclusion. Then ask once: 'Set up weekly monitoring?'

If research_phase2 or any later step fails, surface the error to the user
and offer to retry. Earlier saved data is preserved.

Do NOT call phase2_run_all — it is a legacy fallback that double-charges
client/proxy timeouts. research_phase2 + research_phase2_status is the
only supported path.

## VIEW FLOW (existing trees)

  my_workspace (start here) → read_tree · read_branch · read_history ·
  propose_edit (sandbox) · apply_edit ·
  pause_monitoring · resume_monitoring · cancel_monitoring.

Ask me for a ticker to begin.`;

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "drawtree": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer dt_xxxxxxxx"
      }
    }
  }
}`;

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="px-3 py-1.5 text-xs border border-line rounded hover:bg-paper-2 transition"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

export default function Start() {
  const [step, setStep] = useState(1);

  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      <header className="mb-10">
        <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
          ← Draw Tree
        </Link>
        <h1 className="text-3xl tracking-tight mt-3">Start in 3 minutes</h1>
        <p className="text-muted mt-2 text-sm leading-relaxed max-w-xl">
          Connect Draw Tree to any AI client that speaks Remote MCP. New
          accounts get <strong>30 free credits</strong>. Framework design
          in Phase 1 is free; Phase 2 charges a single flat bundle covering
          research, scenarios, and publication.
        </p>
      </header>

      {/* Step 1 — get key */}
      <section className="mb-8 border border-line rounded p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">1 · Get an API key</h2>
          <span className="text-xs text-muted">free · 30 credits on signup</span>
        </div>
        <p className="text-sm text-muted mb-4">
          Sign up to receive your <code>dt_xxxx</code> API key and your
          starting balance.
        </p>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 transition"
          >
            Sign up →
          </Link>
          <Link
            href="/account"
            className="px-4 py-2 text-sm border border-line rounded hover:bg-paper-2 transition"
          >
            Already have a key? Sign in
          </Link>
        </div>
      </section>

      {/* Step 2 — pick a client */}
      <section className="mb-8 border border-line rounded p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">2 · Connect a client</h2>
        </div>
        <div className="flex gap-2 mb-4 text-xs">
          {["Perplexity Pro", "Claude Desktop", "Other (raw)"].map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i + 1)}
              className={`px-3 py-1.5 rounded border ${
                step === i + 1
                  ? "bg-ink text-paper border-ink"
                  : "border-line hover:bg-paper-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="text-sm space-y-3">
            <ol className="list-decimal list-inside space-y-1 text-muted">
              <li>Open Perplexity → Settings → Connectors</li>
              <li>
                Click <strong>+ Custom connector</strong> →{" "}
                <strong>Remote</strong>
              </li>
              <li>
                Name: <code>Drawtree</code>
              </li>
              <li>
                MCP server URL:{" "}
                <code className="bg-paper-2 px-1 rounded">{MCP_URL}</code>
              </li>
              <li>
                Transport: <code>Streamable HTTP</code>
              </li>
              <li>
                Auth: <code>API Key</code> · paste your <code>dt_xxx</code>
              </li>
            </ol>
            <div className="mt-3">
              <CopyBtn text={MCP_URL} label="Copy MCP URL" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-sm space-y-3">
            <p className="text-muted">
              Add to <code>claude_desktop_config.json</code> (replace{" "}
              <code>dt_xxxxxxxx</code> with your key):
            </p>
            <pre className="bg-paper-2 border border-line rounded p-3 text-xs overflow-x-auto">
              {CLAUDE_DESKTOP_CONFIG}
            </pre>
            <CopyBtn text={CLAUDE_DESKTOP_CONFIG} label="Copy config" />
          </div>
        )}

        {step === 3 && (
          <div className="text-sm space-y-3 text-muted">
            <p>
              Any Remote-MCP-aware client: point at{" "}
              <code>{MCP_URL}</code> with header{" "}
              <code>Authorization: Bearer dt_xxx</code>. Transport is Streamable
              HTTP per the MCP spec.
            </p>
            <CopyBtn text={MCP_URL} label="Copy MCP URL" />
          </div>
        )}
      </section>

      {/* Step 3 — starter prompt */}
      <section className="mb-8 border border-line rounded p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">3 · Drop in the starter prompt</h2>
        </div>
        <p className="text-sm text-muted mb-3">
          Paste this into your client to give the model the right workflow.
          Then say <em>"I want to analyze NVDA"</em> (or any ticker).
        </p>
        <pre className="bg-paper-2 border border-line rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap">
          {STARTER_PROMPT}
        </pre>
        <div className="mt-3 flex gap-2">
          <CopyBtn text={STARTER_PROMPT} label="Copy starter prompt" />
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-8 border border-line rounded p-6 text-sm">
        <h2 className="text-lg mb-3">Credits</h2>
        <p className="text-muted text-xs mb-4">
          Phase 1 (framework design) is always free. Phase 2 charges{" "}
          <strong>one flat 50-credit bundle</strong> at{" "}
          <code>confirm_framework</code> covering everything that follows —
          deep research, scenarios, and publication. New accounts get 30 free
          credits; top up at <code>/account</code> when you're ready to
          publish your first tree.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-2">
              Phase 1 · free design
            </div>
            <ul className="space-y-0.5 text-muted">
              <li><code>start_draft</code></li>
              <li><code>frame_narrative</code> / <code>save_narrative</code></li>
              <li><code>frame_h0</code> / <code>save_h0</code></li>
              <li><code>design_branches</code> / <code>fetch_framework_details</code> / <code>save_branches</code></li>
              <li><code>design_leaves</code> / <code>save_leaves</code></li>
              <li><code>design_scenarios</code> / <code>save_scenarios</code></li>
              <li><code>preview_tree</code></li>
            </ul>
          </div>
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-2">
              Phase 2 · flat bundle
            </div>
            <ul className="space-y-0.5 text-muted">
              <li><code>confirm_framework</code> · 50 cr (flat)</li>
              <li className="text-[11px] mt-1">covers:</li>
              <li className="text-[11px] pl-3">· <code>research_phase2</code></li>
              <li className="text-[11px] pl-3">· <code>research_phase2_status</code></li>
              <li className="text-[11px] pl-3">· <code>compute_scenarios</code></li>
              <li className="text-[11px] pl-3">· <code>commit_draft_tree</code></li>
              <li className="text-[11px] pl-3">· <code>summarize_tree</code></li>
              <li className="text-[11px] mt-1">retries on this draft are free.</li>
            </ul>
          </div>
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-2">
              Monitoring (optional)
            </div>
            <ul className="space-y-0.5 text-muted">
              <li><code>setup_monitoring</code> · 5 cr / week</li>
              <li><code>pause_monitoring</code> · free</li>
              <li><code>resume_monitoring</code> · free</li>
              <li><code>cancel_monitoring</code> · prorate refund</li>
            </ul>
          </div>
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-2">
              View · all free except apply
            </div>
            <ul className="space-y-0.5 text-muted">
              <li><code>my_workspace</code> · <code>read_tree</code></li>
              <li><code>read_branch</code> · <code>read_history</code></li>
              <li><code>propose_edit</code> · sandbox</li>
              <li><code>apply_edit</code> · 2 cr / leaf</li>
            </ul>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-line text-xs text-muted">
          <strong>Typical first tree:</strong> 50 credits flat (Phase 2 bundle)
          + 5 credits for the first week of monitoring = 55 credits. New
          accounts start with 30 free credits; top up once for your first
          published tree.
        </div>
      </section>

      <footer className="text-xs text-muted text-center pt-4 border-t border-line">
        <div className="flex justify-center gap-4">
          <Link href="/spec" className="underline-offset-4 hover:underline">
            Protocol spec
          </Link>
          <Link href="/account" className="underline-offset-4 hover:underline">
            My account
          </Link>
        </div>
      </footer>
    </main>
  );
}

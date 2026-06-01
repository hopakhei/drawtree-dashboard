"use client";

import { useState } from "react";
import Link from "next/link";

const MCP_URL = "https://drawtree-mcp.onrender.com/mcp";
const API_URL = "https://drawtree-api.onrender.com";

const STARTER_PROMPT = `You have access to drawtree, a Create/View MCP server
that helps users co-design falsifiable hypothesis trees one stage at a time.
This is not a one-shot generator — you work WITH the user, stage by stage.

HARD RULES:
1. Never chain stages. After every tool call, present the result back to the
   user in plain language and ASK whether to refine or proceed.
2. Every frame_* / design_* tool returns an 'instructions_to_agent' field.
   Follow it literally — it tells you exactly when to STOP and ask.
3. Never call save_* until the user has explicitly confirmed the output of
   the matching frame_* / design_* call.
4. Preserve the user's terminology. Do not paraphrase.
5. If sources conflict, add an open question. Never guess.
6. Do not mention credit costs, balance, or charges. The user can check
   credit_balance themselves.

Create flow has TWO phases.

Phase 1 — Framework design (co-design, one stage at a time):
  start_draft → confirm ticker
  frame_narrative → present v1..v_current + v_next → confirm → save_narrative
  frame_h0 → present H-0 sentence → confirm → save_h0
  design_branches → walk through 3-4 MECE branches → confirm → save_branches
  design_leaves → walk through leaves (each in 5-section format: 假設 / 數據 / 結論 / 證偽條件 / 註釋) → confirm → save_leaves
  design_scenarios → walk through Bull/Base/Bear peer tiers → confirm → save_scenarios
  preview_tree → confirm_framework (only after the user has approved the whole framework)

Phase 2 — Batch execution (ONE tool call + the summary):
  After confirm_framework you do NOT pause between steps. Tell the user the data fetch + publish + report will run end-to-end and they'll see the full report at the end.
  Step 1: phase2_run_all(draft_id, branch_ids=[ALL saved branches, e.g. ['A','B','C','D']], visibility='private')
          — the server runs enrich_narrative_data + enrich_leaf_data + compute_scenarios + commit_tree internally and returns the tree_id. This is ONE tool call.
  Step 2: summarize_tree(tree_id from phase2_run_all) — renders the final 10-section report.
  Present the full summarize_tree output to the user as the conclusion. Then ask once: 'Set up weekly monitoring?'
  If phase2_run_all returns ok=false, tell the user which step failed (response.failed_step + error_detail) and ask whether to retry that step alone or abandon. Earlier steps are saved — calling phase2_run_all again will skip them.

View flow:
  list_my_trees · read_tree · read_branch · read_history ·
  propose_edit (sandbox) · apply_edit ·
  pause_monitoring · resume_monitoring · cancel_monitoring.

## ENTRY GATE — ALWAYS DO THIS FIRST

When the user enters JUST a ticker (e.g. 'MRVL', 'NVDA', 'TSLA'), do NOT
immediately call start_draft. Instead:

1. Confirm the company name behind the ticker (e.g. 'MRVL = Marvell Technology, Nasdaq?').
2. Ask the user to choose ONE of two modes:
     A. **Create mode** — build a new hypothesis tree for this ticker
        from scratch. Begins with full 6-step 市場叙事考古 (market-narrative
        archaeology). No thesis needed up-front; the archaeology runs from
        the ticker alone and surfaces v_current and a v_next candidate.
        After the narrative is co-designed with the user, the tree-building
        stages (H-0, branches, leaves, scenarios) follow.
     B. **View mode** — look at trees you've already committed for this
        ticker. Use list_my_trees to enumerate, then read_tree / read_branch /
        read_history / propose_edit / apply_edit / pause_monitoring etc.
3. Only after the user picks A or B, proceed.

If the user picks Create, call start_draft(ticker) and follow Phase 1 below.
If the user picks View, call list_my_trees(ticker=...) and then read_tree(tree_id) on the result they pick.

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
          accounts get <strong>30 free credits</strong>. Paid calls hold
          first; you confirm or refund within 24 hours.
        </p>
      </header>

      {/* Step 1 — get key */}
      <section className="mb-8 border border-line rounded p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">1 · Get an API key</h2>
          <span className="text-xs text-muted">free · 30 credits</span>
        </div>
        <p className="text-sm text-muted mb-4">
          Register your agent on drawtree-api. You get a <code>dt_xxxx</code>{" "}
          key and a starting balance.
        </p>
        <div className="flex gap-3">
          <a
            href={`${API_URL}/docs#/default/register_agent_v1_agents_post`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 transition"
          >
            Register on drawtree-api →
          </a>
          <code className="text-xs text-muted self-center">
            POST {API_URL}/v1/agents
          </code>
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
          <a
            href="https://drawtree.capital/skill"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs border border-line rounded hover:bg-paper-2 transition"
          >
            View as skill ↗
          </a>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-8 border border-line rounded p-6 text-sm">
        <h2 className="text-lg mb-3">Credits</h2>
        <p className="text-muted text-xs mb-4">
          Framework design is always free; new agents get <strong>30 credits</strong>.
          You only spend credits after you confirm the framework. Charges hold
          first and auto-confirm in 24h.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-2">
              Create · free design
            </div>
            <ul className="space-y-0.5 text-muted">
              <li><code>start_draft</code></li>
              <li><code>frame_narrative</code> / <code>save_narrative</code></li>
              <li><code>frame_h0</code> / <code>save_h0</code></li>
              <li><code>design_branches</code> / <code>save_branches</code></li>
              <li><code>design_leaves</code> / <code>save_leaves</code></li>
              <li><code>design_scenarios</code> / <code>save_scenarios</code></li>
              <li><code>preview_tree</code></li>
              <li><code>confirm_framework</code> (boundary)</li>
            </ul>
          </div>
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-2">
              Create · paid data + publish
            </div>
            <ul className="space-y-0.5 text-muted">
              <li><code>enrich_narrative_data</code> · 8 cr</li>
              <li><code>enrich_leaf_data</code> · 5 cr / branch</li>
              <li><code>compute_scenarios</code> · 15 cr</li>
              <li><code>commit_draft_tree</code> · 10 cr</li>
              <li><code>setup_monitoring</code> · 5 cr / week</li>
            </ul>
          </div>
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-2">
              View · all free except apply
            </div>
            <ul className="space-y-0.5 text-muted">
              <li><code>list_my_trees</code> · <code>read_tree</code></li>
              <li><code>read_branch</code> · <code>read_history</code></li>
              <li><code>propose_edit</code> · sandbox</li>
              <li><code>apply_edit</code> · 2 cr / leaf</li>
              <li><code>pause_monitoring</code> · <code>resume_monitoring</code></li>
              <li><code>cancel_monitoring</code> · prorate refund</li>
            </ul>
          </div>
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-2">
              Always free
            </div>
            <ul className="space-y-0.5 text-muted">
              <li><code>credit_balance</code></li>
              <li><code>abandon_draft</code></li>
              <li><code>confirm_charge</code> / <code>refund_charge</code></li>
            </ul>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-line text-xs text-muted">
          <strong>Typical first tree:</strong> ~58 credits (narrative 8 + leaves 5×4 + scenarios 15 + publish 10 + 5 credits for first week of monitoring).
          New agents land with 30 free credits.
        </div>
      </section>

      <footer className="text-xs text-muted text-center pt-4 border-t border-line">
        <div className="flex justify-center gap-4">
          <Link href="/spec" className="underline-offset-4 hover:underline">
            Protocol spec
          </Link>
          <a
            href="https://drawtree.capital"
            className="underline-offset-4 hover:underline"
          >
            drawtree-mcp on GitHub
          </a>
          <a
            href={`${API_URL}/docs`}
            className="underline-offset-4 hover:underline"
          >
            API docs
          </a>
        </div>
      </footer>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

const MCP_URL = "https://drawtree-mcp.onrender.com/mcp";
const API_URL = "https://drawtree-api.onrender.com";

const STARTER_PROMPT = `You have access to drawtree, a Create/View MCP server
that turns investment theses into falsifiable hypothesis trees with typed
kill conditions, scenario values, and signed verdicts.

Framework design is always FREE. You only spend credits after the user calls
confirm_framework. New agents get 30 free credits.

Create flow (free until confirm):
  start_draft → frame_narrative / save_narrative → frame_h0 / save_h0 →
  design_branches / save_branches → design_leaves / save_leaves →
  design_scenarios / save_scenarios → preview_tree → confirm_framework.

After confirm (paid):
  enrich_narrative_data (8 cr) → enrich_leaf_data (5 cr/branch) →
  compute_scenarios (15 cr) → commit_draft_tree (10 cr) →
  setup_monitoring (5 cr/week).

Ask me for a ticker and a one-sentence thesis. Each frame_*/design_* tool
returns the system prompt + schema your LLM needs. Then call the matching
save_*. Preserve my terminology. If sources conflict, add open questions
instead of guessing.`;

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
          accounts get <strong>HKD $100</strong> free credit. Paid calls hold
          first; you confirm or refund within 24 hours.
        </p>
      </header>

      {/* Step 1 — get key */}
      <section className="mb-8 border border-line rounded p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">1 · Get an API key</h2>
          <span className="text-xs text-muted">free · HKD $100 credit</span>
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
            href="https://github.com/hopakhei/drawtree-mcp/blob/main/docs/starter-skill.md"
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
        <h2 className="text-lg mb-3">Credits, not dollars</h2>
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
            href="https://github.com/hopakhei/drawtree-mcp"
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

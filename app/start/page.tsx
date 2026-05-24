"use client";

import { useState } from "react";
import Link from "next/link";

const MCP_URL = "https://drawtree-mcp.onrender.com/mcp";
const API_URL = "https://drawtree-api.onrender.com";

const STARTER_PROMPT = `You have access to the drawtree MCP server. It exposes 13 tools to turn any
investment thesis into a falsifiable tree with typed kill conditions, scenario
values, and signed verdicts. Free tools: validate_tree, aggregate_tree,
commit_tree, read_tree, suggest_framework, balance. Paid tools (priced in HKD,
held first then auto-confirmed in 24h): register_narrative, enrich_branches,
suggest_falsification, derive_scenario_values, subscribe_alerts.

Help me build a tree. Ask me for the ticker and a one-sentence thesis. Then
follow the drawtree-starter skill workflow: frame H-0 → suggest_framework →
enrich_branches → write leaves → suggest_falsification → validate_tree →
aggregate_tree → commit_tree. Preserve my terminology. If sources conflict,
create an open_questions entry instead of guessing.`;

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

      {/* Tools recap */}
      <section className="mb-8 border border-line rounded p-6 text-sm">
        <h2 className="text-lg mb-3">13 tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-muted">
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-1">
              Free
            </div>
            <ul className="space-y-0.5">
              <li><code>validate_tree</code></li>
              <li><code>aggregate_tree</code></li>
              <li><code>commit_tree</code></li>
              <li><code>read_tree</code></li>
              <li><code>suggest_framework</code></li>
              <li><code>balance</code></li>
            </ul>
          </div>
          <div>
            <div className="text-ink text-xs uppercase tracking-wider mb-1">
              Paid (HKD, 24h hold)
            </div>
            <ul className="space-y-0.5">
              <li><code>register_narrative</code> · $2</li>
              <li><code>enrich_branches</code> · $3/branch</li>
              <li><code>suggest_falsification</code> · $2</li>
              <li><code>derive_scenario_values</code> · $10</li>
              <li><code>subscribe_alerts</code> · per-alert</li>
              <li><code>confirm_charge</code> / <code>refund_charge</code></li>
            </ul>
          </div>
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

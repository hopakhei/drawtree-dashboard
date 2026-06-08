"use client";

import { useState } from "react";

// Connect-your-AI card. Renders four tabs — Claude Code, Codex, Claude
// Desktop, Perplexity — each with a single copy-paste-ready snippet
// pre-filled with the signed-in user's actual dt_xxx key. No OAuth yet
// (Phase 2 will add ChatGPT + Claude.ai web). Designed to be foolproof
// for non-technical users: one tab → one copy button → done.

const MCP_URL = "https://drawtree-mcp.onrender.com/mcp";

type ClientKey =
  | "chatgpt"
  | "claude_code"
  | "codex"
  | "claude_desktop"
  | "perplexity";

const CLIENTS: { key: ClientKey; label: string; tagline: string }[] = [
  { key: "chatgpt",        label: "ChatGPT",        tagline: "Web · OAuth (1 click)" },
  { key: "claude_code",    label: "Claude Code",    tagline: "Terminal · 1 command" },
  { key: "codex",          label: "Codex CLI",      tagline: "Terminal · 1 command" },
  { key: "claude_desktop", label: "Claude Desktop", tagline: "JSON config" },
  { key: "perplexity",     label: "Perplexity",     tagline: "Web · custom connector" },
];

function snippetFor(client: ClientKey, key: string): string {
  switch (client) {
    case "chatgpt":
      return `Settings → Connectors → + Create connector

  Name:             Drawtree
  Server URL:       https://drawtree-mcp.onrender.com/mcp
  Authentication:   OAuth (auto-detected — ChatGPT will redirect you to
                    drawtree.capital to sign in and approve)

  ✓ I trust this application
  → Click Create`;
    case "claude_code":
      return `claude mcp add drawtree \\
  --transport http \\
  --header "Authorization: Bearer ${key}" \\
  ${MCP_URL}`;
    case "codex":
      return `# 1. Save your key as an env var
export DRAWTREE_API_KEY="${key}"

# 2. Add to ~/.codex/config.toml (or run: codex mcp add drawtree ${MCP_URL})
[mcp_servers.drawtree]
url = "${MCP_URL}"
bearer_token_env_var = "DRAWTREE_API_KEY"`;
    case "claude_desktop":
      return `// Open Settings → Developer → Edit Config, then paste:
{
  "mcpServers": {
    "drawtree": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${key}"
      }
    }
  }
}`;
    case "perplexity":
      return `Settings → Connectors → + Custom connector → Remote

  Name:           Drawtree
  MCP server URL: ${MCP_URL}
  Transport:      Streamable HTTP
  Auth type:      API Key
  API key:        ${key}`;
  }
}

function nextStepFor(client: ClientKey): string {
  switch (client) {
    case "chatgpt":
      return "ChatGPT will open a browser tab to drawtree.capital — sign in with your email (magic link) and click Approve. ChatGPT Plus / Pro / Team / Enterprise / Edu only; you must first enable Developer Mode in Settings → Connectors → Advanced.";
    case "claude_code":
      return "Paste the command in your terminal. Claude Code writes the config for you. Restart Claude Code, then ask: \"List my drawtree tools.\"";
    case "codex":
      return "After saving the config, run `codex` in a fresh terminal. The drawtree tools will appear in your session.";
    case "claude_desktop":
      return "Save the file and restart Claude Desktop. The drawtree icon will appear in the message bar.";
    case "perplexity":
      return "Paste the URL, pick Streamable HTTP, paste your key under API Key. The connector appears in your sidebar.";
  }
}

export default function InstallMcpCard({
  apiKey,
}: {
  // Signed-in user's full dt_xxx key. Required; this card is only shown
  // after auth.
  apiKey: string;
}) {
  // Default to ChatGPT — it's the biggest user segment and now ships with
  // a real one-click OAuth install. CLI users will pick their own tab.
  const [active, setActive] = useState<ClientKey>("chatgpt");
  const [copied, setCopied] = useState(false);
  const snippet = snippetFor(active, apiKey);
  const nextStep = nextStepFor(active);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <section className="mt-6 border border-line rounded p-6">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 className="text-lg">Connect your AI</h2>
        <span className="text-xs text-muted">
          One copy-paste · works in 30 seconds
        </span>
      </div>
      <p className="text-xs text-muted mb-4">
        Plug Draw Tree into any AI client that speaks Model Context Protocol.
        Your key is pre-filled below — pick your client, copy, paste, done.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {CLIENTS.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setActive(c.key);
              setCopied(false);
            }}
            className={`text-xs px-3 py-2 rounded border transition ${
              active === c.key
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-line text-muted hover:bg-line/30"
            }`}
          >
            <div className="font-medium">{c.label}</div>
            <div className="text-[10px] opacity-70 mt-0.5">{c.tagline}</div>
          </button>
        ))}
      </div>

      {/* Snippet + copy */}
      <div className="relative">
        <pre className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-all bg-paper border border-line rounded p-3 pr-20 overflow-x-auto">
          {snippet}
        </pre>
        <button
          onClick={copy}
          className={`absolute top-2 right-2 text-xs px-2 py-1 rounded border transition ${
            copied
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-line bg-white hover:bg-line/30"
          }`}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      {/* Next step */}
      <div className="text-[11px] text-muted mt-3">
        <strong className="text-ink">Next:</strong> {nextStep}
      </div>

      {/* Footer hint — OAuth is now live for ChatGPT/Claude.ai web */}
      <div className="mt-4 text-[11px] text-muted border-t border-line pt-3">
        Pick <strong>ChatGPT</strong> if you&apos;re on the web. The CLI tabs
        use your API key directly; the web tabs use a signed-in OAuth flow
        so your key never leaves drawtree.capital.
      </div>
    </section>
  );
}

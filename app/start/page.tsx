"use client";

// Unified setup guide. The ONLY place that explains how to connect
// Draw Tree to an AI client. Previously this info was scattered
// across /start, /account (InstallMcpCard), and a separate manual-
// OAuth card — users got confused which step came first.
//
// New flow: three numbered sections (sign in → connect → prompt).
// Each step has a "Done — next →" button. The page adapts to whether
// the visitor is signed in:
//
//   - Signed out: shows generic instructions with placeholder
//     'dt_xxx' / Client ID. Step 1 prompts sign-in via 6-digit code
//     so they never leave the page.
//   - Signed in: pre-fills the API key, auto-mints (or shows) an
//     OAuth client_id, and unlocks the starter-prompt step.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const API_URL  = "https://drawtree-api.onrender.com";
const MCP_URL  = "https://drawtree-mcp.onrender.com/mcp";

// Same starter prompt as before. Centralised here so we never have to
// edit it in two places.
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

## VIEW FLOW (existing trees)

  my_workspace (start here) → read_tree · read_branch · read_history ·
  propose_edit (sandbox) · apply_edit ·
  pause_monitoring · resume_monitoring · cancel_monitoring.

Ask me for a ticker to begin.`;

// Clients sorted by user popularity. Each entry knows whether it uses
// OAuth (web clients that won't accept a static Bearer token) or a
// plain API key (CLI / desktop clients).
type ClientKey =
  | "chatgpt"
  | "claude_ai"
  | "perplexity"
  | "claude_code"
  | "codex"
  | "claude_desktop";

type ClientDef = {
  key: ClientKey;
  label: string;
  tagline: string;
  authMode: "oauth" | "apikey";
  // Inline step-by-step rendered as JSX (so we can include code blocks
  // with the user's actual key / client_id pre-filled).
  body: (apiKey: string, clientId: string | null) => JSX.Element;
};

function MonoLine({ children }: { children: React.ReactNode }) {
  return (
    <code className="block bg-paper-2 border border-line rounded px-2 py-1 text-[12px] font-mono break-all">
      {children}
    </code>
  );
}

const CLIENTS: ClientDef[] = [
  {
    key: "chatgpt",
    label: "ChatGPT",
    tagline: "Web · OAuth",
    authMode: "oauth",
    body: () => (
      <ol className="text-sm space-y-2 list-decimal list-inside text-muted">
        <li>
          In ChatGPT: <strong>Settings → Connectors → Advanced</strong>,
          turn on <strong>Developer Mode</strong> (Plus / Pro / Team / Edu only).
        </li>
        <li>
          <strong>Settings → Connectors → + Create connector</strong>
        </li>
        <li>
          Name: <code>Drawtree</code>
        </li>
        <li>
          MCP server URL: <MonoLine>{MCP_URL}</MonoLine>
        </li>
        <li>
          Authentication: <strong>OAuth</strong> (auto-detected).
          Leave Client ID and Client Secret blank.
        </li>
        <li>
          Tick <em>I trust this application</em> → Create.
        </li>
        <li>
          A popup opens to drawtree.capital — enter your email and the
          6-digit code from the email → Approve. ChatGPT activates the
          connector.
        </li>
      </ol>
    ),
  },
  {
    key: "claude_ai",
    label: "Claude.ai",
    tagline: "Web · OAuth",
    authMode: "oauth",
    body: () => (
      <ol className="text-sm space-y-2 list-decimal list-inside text-muted">
        <li>
          In Claude.ai: <strong>Customize → Connectors → + Add custom
          connector</strong>
        </li>
        <li>
          Name: <code>Drawtree</code>
        </li>
        <li>
          Remote MCP server URL: <MonoLine>{MCP_URL}</MonoLine>
        </li>
        <li>
          Leave <strong>OAuth Client ID</strong> and{" "}
          <strong>OAuth Client Secret</strong> blank.
        </li>
        <li>Click <strong>Add</strong>.</li>
        <li>
          A popup opens to drawtree.capital — enter your email and the
          6-digit code from the email → Approve.
        </li>
      </ol>
    ),
  },
  {
    key: "perplexity",
    label: "Perplexity",
    tagline: "Web · OAuth (manual Client ID)",
    authMode: "oauth",
    body: (_, clientId) => (
      <div className="text-sm space-y-3 text-muted">
        <p>
          Perplexity is the one client that doesn&apos;t auto-register, so
          you need to paste a Client ID. Generate one with the button
          below, then:
        </p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>
            Perplexity: <strong>Settings → Connectors → + Custom
            connector</strong>
          </li>
          <li>
            Name: <code>Drawtree</code>
          </li>
          <li>
            MCP server URL: <MonoLine>{MCP_URL}</MonoLine>
          </li>
          <li>
            Transport: <code>Streamable HTTP</code>
          </li>
          <li>
            Authentication: <strong>OAuth</strong>
          </li>
          <li>
            Client ID:{" "}
            {clientId ? (
              <MonoLine>{clientId}</MonoLine>
            ) : (
              <span className="text-[11px]">
                (generate one in the panel below — only takes a click)
              </span>
            )}
          </li>
          <li>
            Client Secret: <code>none-required</code> (placeholder — we use
            PKCE, no real secret).
          </li>
          <li>
            Tick the risk acknowledgement → <strong>Add</strong>. Approve
            in the popup that opens to drawtree.capital.
          </li>
        </ol>
      </div>
    ),
  },
  {
    key: "claude_code",
    label: "Claude Code",
    tagline: "Terminal · 1 command",
    authMode: "apikey",
    body: (apiKey) => (
      <div className="text-sm space-y-3 text-muted">
        <p>Run this in your terminal:</p>
        <pre className="bg-paper-2 border border-line rounded p-3 text-[12px] overflow-x-auto whitespace-pre-wrap">
{`claude mcp add drawtree \\
  --transport http \\
  --header "Authorization: Bearer ${apiKey || "dt_xxxxxxxx"}" \\
  ${MCP_URL}`}
        </pre>
        <p className="text-[11px]">
          Restart Claude Code, then ask &ldquo;List my drawtree tools.&rdquo;
        </p>
      </div>
    ),
  },
  {
    key: "codex",
    label: "Codex CLI",
    tagline: "Terminal · config file",
    authMode: "apikey",
    body: (apiKey) => (
      <div className="text-sm space-y-3 text-muted">
        <p>
          Export your key, then add an MCP entry to{" "}
          <code>~/.codex/config.toml</code>:
        </p>
        <pre className="bg-paper-2 border border-line rounded p-3 text-[12px] overflow-x-auto whitespace-pre-wrap">
{`# 1. Save the key as an env var
export DRAWTREE_API_KEY="${apiKey || "dt_xxxxxxxx"}"

# 2. Append to ~/.codex/config.toml
[mcp_servers.drawtree]
url = "${MCP_URL}"
bearer_token_env_var = "DRAWTREE_API_KEY"`}
        </pre>
        <p className="text-[11px]">
          Run <code>codex</code> in a fresh terminal — the drawtree tools
          appear automatically.
        </p>
      </div>
    ),
  },
  {
    key: "claude_desktop",
    label: "Claude Desktop",
    tagline: "JSON config",
    authMode: "apikey",
    body: (apiKey) => (
      <div className="text-sm space-y-3 text-muted">
        <p>
          Open <strong>Settings → Developer → Edit Config</strong>, then
          paste:
        </p>
        <pre className="bg-paper-2 border border-line rounded p-3 text-[12px] overflow-x-auto whitespace-pre-wrap">
{`{
  "mcpServers": {
    "drawtree": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${apiKey || "dt_xxxxxxxx"}"
      }
    }
  }
}`}
        </pre>
        <p className="text-[11px]">
          Save and restart Claude Desktop. The drawtree icon appears in the
          message bar.
        </p>
      </div>
    ),
  },
];

// Visual mask for an MCP API key when we want to confirm 'a key is set'
// without leaking the full secret on screen. Keeps the prefix
// (dt_aBcDeFg) so the user can verify it matches what's in their
// password manager, then a long bullet run for the body.
function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 12) return key;
  return `${key.slice(0, 10)}••••••••••••••••••••••••••••`;
}

// Download links for the three skill artifacts our /api routes serve.
const SKILL_MD_URL  = "/api/skill/skill.md";
const SKILL_ZIP_URL = "/api/skill/skill.zip";
const AGENTS_MD_URL = "/api/skill/agents.md";

// Per-client skill install panel. Renders the right install path for
// each AI client — different file format + different drop location for
// each. Centralised here so step 3 always reflects what step 2 selected.
function SkillInstallPanel({ client }: { client: ClientKey }) {
  switch (client) {
    case "chatgpt":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>
            ChatGPT&apos;s consumer tier doesn&apos;t have a skill/plugin
            primitive yet. Use one of these instead:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong className="text-ink">Custom GPT (recommended).</strong>{" "}
              ChatGPT → Explore GPTs → Create → Configure → paste the
              raw instructions (see expandable section below) into the{" "}
              <em>Instructions</em> field. Save. Open your custom GPT —
              the drawtree connector and the workflow rules are both
              attached.
            </li>
            <li>
              <strong className="text-ink">Project instructions.</strong>{" "}
              ChatGPT Projects → New project → set the Project
              instructions to the raw text below. Every chat in that
              project inherits it.
            </li>
          </ol>
        </div>
      );

    case "claude_ai":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>
            Upload the skill ZIP to Claude.ai (Anthropic Skills format).
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Download the skill bundle below — it&apos;s a ZIP
              containing <code>drawtree/SKILL.md</code>.
            </li>
            <li>
              Claude.ai → <strong>Settings → Capabilities → Skills →
              Upload Skill</strong>.
            </li>
            <li>Pick the ZIP, then toggle the skill on.</li>
            <li>
              Open a chat. The skill auto-activates when you mention a
              ticker or say &ldquo;drawtree&rdquo;.
            </li>
          </ol>
          <DownloadRow
            href={SKILL_ZIP_URL}
            filename="drawtree-skill.zip"
            label="Download drawtree-skill.zip"
          />
        </div>
      );

    case "perplexity":
      return (
        <div className="text-sm space-y-4 text-muted">
          <div className="space-y-3">
            <p>
              <strong className="text-ink">Option A — Web upload (1 minute).</strong>{" "}
              Works for everyone with Perplexity Max access to Computer.
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Download the skill .md or .zip below.</li>
              <li>
                Open{" "}
                <a
                  href="https://www.perplexity.ai/computer/skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline-offset-4 hover:underline"
                >
                  perplexity.ai/computer/skills
                </a>{" "}
                → <strong>+ Create skill</strong> → <strong>Upload a
                skill</strong>.
              </li>
              <li>Attach the file. The skill activates immediately.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <DownloadRow
                href={SKILL_MD_URL}
                filename="drawtree-SKILL.md"
                label="Download SKILL.md"
              />
              <DownloadRow
                href={SKILL_ZIP_URL}
                filename="drawtree-skill.zip"
                label="Download drawtree-skill.zip"
                secondary
              />
            </div>
          </div>

          <div className="border-t border-line pt-4 space-y-3">
            <p>
              <strong className="text-ink">Option B — Sonar API.</strong>{" "}
              If you&apos;re using Perplexity&apos;s{" "}
              <a
                href="https://docs.perplexity.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline-offset-4 hover:underline"
              >
                Sonar / Agent API
              </a>{" "}
              programmatically (i.e. you have a <code>pplx-xxx</code> key,
              not just a Max subscription), pass the SKILL.md content as
              your <code>system</code> message. The MCP server isn&apos;t
              callable from Sonar today, but the workflow rules still help
              the model structure its reply.
            </p>
            <pre className="bg-paper-2 border border-line rounded p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`curl https://api.perplexity.ai/chat/completions \\
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "sonar-reasoning-pro",
    "messages": [
      {"role": "system", "content": "<paste SKILL.md body here>"},
      {"role": "user",   "content": "Analyze NVDA"}
    ]
  }'`}
            </pre>
          </div>
        </div>
      );

    case "claude_code":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>
            Claude Code reads skills from <code>~/.claude/skills/</code>{" "}
            (global) or <code>.claude/skills/</code> in the current project.
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Make the skill folder and drop the SKILL.md into it:
            </li>
          </ol>
          <pre className="bg-paper-2 border border-line rounded p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`mkdir -p ~/.claude/skills/drawtree
curl -L https://drawtree.capital${SKILL_MD_URL} \\
  -o ~/.claude/skills/drawtree/SKILL.md`}
          </pre>
          <p className="text-[11px]">
            Then run <code>/skills</code> in Claude Code to confirm it
            loaded, or just say &ldquo;Use the drawtree skill…&rdquo;.
          </p>
          <DownloadRow
            href={SKILL_MD_URL}
            filename="SKILL.md"
            label="Download SKILL.md (manual install)"
          />
        </div>
      );

    case "codex":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>
            Codex CLI auto-loads <code>AGENTS.md</code> files from your
            Codex home or the current project root. No special command —
            just drop the file.
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Save the AGENTS.md to your Codex home (applies to every
              session):
            </li>
          </ol>
          <pre className="bg-paper-2 border border-line rounded p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`mkdir -p ~/.codex
curl -L https://drawtree.capital${AGENTS_MD_URL} \\
  -o ~/.codex/AGENTS.md`}
          </pre>
          <p className="text-[11px]">
            Per-project alternative: drop the same file at{" "}
            <code>&lt;project-root&gt;/AGENTS.md</code>. Codex merges
            global + project files automatically.
          </p>
          <DownloadRow
            href={AGENTS_MD_URL}
            filename="AGENTS.md"
            label="Download AGENTS.md (manual install)"
          />
        </div>
      );

    case "claude_desktop":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>
            Same Anthropic Skills format as Claude.ai — upload the ZIP
            in Settings.
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Download the skill bundle below.</li>
            <li>
              Claude Desktop → <strong>Settings → Capabilities → Skills
              → Upload Skill</strong>.
            </li>
            <li>Pick the ZIP, then toggle the skill on.</li>
          </ol>
          <DownloadRow
            href={SKILL_ZIP_URL}
            filename="drawtree-skill.zip"
            label="Download drawtree-skill.zip"
          />
        </div>
      );
  }
}

function DownloadRow({
  href,
  filename,
  label,
  secondary = false,
}: {
  href: string;
  filename: string;
  label: string;
  secondary?: boolean;
}) {
  return (
    <a
      href={href}
      download={filename}
      className={
        secondary
          ? "inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-line rounded hover:bg-paper-2 transition"
          : "inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-ink text-paper rounded hover:opacity-90 transition"
      }
    >
      ↓ {label}
    </a>
  );
}

function Copy({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="px-3 py-1.5 text-xs border border-line rounded hover:bg-paper-2 transition"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

export default function Start() {
  // Auth state — populated from sessionStorage on mount.
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [agentEmail, setAgentEmail] = useState<string | null>(null);

  // Inline sign-in (same code-flow as the OAuth consent page).
  const [signInEmail, setSignInEmail] = useState("");
  const [signInCode,  setSignInCode]  = useState("");
  const [signInStage, setSignInStage] = useState<"email" | "code">("email");
  const [signInBusy,  setSignInBusy]  = useState(false);
  const [signInErr,   setSignInErr]   = useState<string | null>(null);

  // OAuth client_id for Perplexity (the one client that needs manual paste).
  const [clientId, setClientId] = useState<string | null>(null);
  const [mintingClient, setMintingClient] = useState(false);
  const [clientErr, setClientErr] = useState<string | null>(null);

  // API-key panel state. Two distinct "in scope" modes:
  //
  //   `keySource === 'fresh'`  — user just clicked Generate. Show the
  //     full key in a green callout with a 'save it now' warning and
  //     an 'I've saved it ✓' acknowledgement button. Until they click,
  //     the snippets below stay populated with the plaintext.
  //
  //   `keySource === 'pasted'` — user pasted a key they already have.
  //     Show prefix only by default (e.g. dt_aBcDeFg…), with an eye
  //     toggle to reveal. They can confirm it matches what's in their
  //     password manager without exposing it on screen.
  //
  // When `apiKey === null`, the panel is in its empty paste-or-generate
  // state. Component state ONLY — nothing persists to localStorage.
  const [regenerating, setRegenerating] = useState(false);
  const [regenErr, setRegenErr] = useState<string | null>(null);
  const [manualKeyInput, setManualKeyInput] = useState("");
  const [keySource, setKeySource] = useState<"fresh" | "pasted" | null>(null);
  const [keyRevealed, setKeyRevealed] = useState(false);

  // Active client tab. Default to ChatGPT since it's the largest segment.
  const [active, setActive] = useState<ClientKey>("chatgpt");

  // Read session token + agent profile on first paint. The user lands on
  // /start either signed-out (post-signup) or signed-in (returning).
  useEffect(() => {
    let mounted = true;
    try {
      const saved = sessionStorage.getItem("drawtree_api_key");
      if (saved && saved.startsWith("dts_")) {
        // Dashboard session token — fetch the agent profile to confirm
        // sign-in. The actual MCP api_key (dt_xxx) is write-once and
        // NOT retrievable; the user must keep it from their signup
        // confirmation email.
        fetch(`${API_URL}/v1/account/me`, {
          headers: { Authorization: `Bearer ${saved}` },
        })
          .then(async (r) => {
            if (!mounted) return;
            if (!r.ok) {
              sessionStorage.removeItem("drawtree_api_key");
              return;
            }
            const me = await r.json();
            setAgentEmail(me.email || null);
          })
          .catch(() => {});
      } else if (saved && saved.startsWith("dt_")) {
        // Legacy / power-user: an MCP API key was cached in this
        // session BEFORE the dashboard switched to dts_ session
        // tokens. Use it for this tab only and don't promote it to
        // anywhere persistent. We DO NOT read or write a long-lived
        // 'dt_' key from localStorage — see security note below.
        setApiKey(saved);
      }
      // SECURITY: we used to also rehydrate a 'dt_' key from
      // localStorage. Removed because:
      //   1. localStorage is shared by every visit to this origin on
      //      this device. A second user signing in on the same
      //      browser would see the previous user's plaintext key.
      //   2. The cached value didn't refresh when the user clicked
      //      'Regenerate' — we'd happily render a now-invalidated
      //      key as if it were live.
      // Belt-and-braces: actively clean up any 'dt_' value any prior
      // build of this page may have written, so existing users get the
      // leak plugged the next time they visit /start.
      try {
        localStorage.removeItem("drawtree_cli_api_key");
      } catch {}
    } catch {}
    return () => {
      mounted = false;
    };
  }, []);

  // ----- inline sign-in (mirrors the consent page) -----
  const requestCode = useCallback(async () => {
    if (!signInEmail.includes("@")) {
      setSignInErr("Please enter a valid email.");
      return;
    }
    setSignInBusy(true);
    setSignInErr(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/request_login_link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail.trim().toLowerCase() }),
      });
      const body = await r.json();
      if (body?.unknown_email) {
        setSignInErr(
          "That email isn't registered. Sign up first below.",
        );
        setSignInBusy(false);
        return;
      }
      setSignInStage("code");
    } catch (e: any) {
      setSignInErr(e?.message || "Network error sending code.");
    }
    setSignInBusy(false);
  }, [signInEmail]);

  const verifyCode = useCallback(async () => {
    const cleaned = signInCode.replace(/\D/g, "");
    if (cleaned.length !== 6) {
      setSignInErr("The code is 6 digits.");
      return;
    }
    setSignInBusy(true);
    setSignInErr(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/verify_login_code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signInEmail.trim().toLowerCase(),
          code:  cleaned,
        }),
      });
      const body = await r.json();
      if (!r.ok) {
        const c = body?.detail?.code || "";
        const msg =
          c === "INVALID_CODE"        ? "That code doesn't match. Check the latest email." :
          c === "CODE_ALREADY_USED"   ? "That code was already used. Request a new one." :
          c === "CODE_EXPIRED"        ? "That code has expired. Request a new one." :
          c === "INVALID_CODE_FORMAT" ? "The code must be 6 digits." :
          `Sign-in failed (${r.status}).`;
        setSignInErr(msg);
        setSignInBusy(false);
        return;
      }
      const tok = body.session_token;
      try {
        sessionStorage.setItem("drawtree_api_key", tok);
      } catch {}
      setAgentEmail(body.email);
      setSignInBusy(false);
    } catch (e: any) {
      setSignInErr(e?.message || "Network error verifying code.");
      setSignInBusy(false);
    }
  }, [signInCode, signInEmail]);

  // ----- OAuth client_id (only needed for Perplexity) -----
  // Auto-fetch any existing client the user already minted. We don't
  // create a new one until they actually click the Perplexity tab and
  // ask for one — keeps the DB clean.
  useEffect(() => {
    if (!agentEmail) return;
    const tok = sessionStorage.getItem("drawtree_api_key");
    if (!tok) return;
    fetch(`${API_URL}/v1/account/oauth_clients`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.clients?.length) {
          setClientId(d.clients[0].client_id);
        }
      })
      .catch(() => {});
  }, [agentEmail]);

  // Regenerate the MCP API key. We only ever call this when the user
  // explicitly clicks the button — it invalidates every existing CLI
  // / Claude Desktop install.
  async function regenerateKey() {
    const tok = sessionStorage.getItem("drawtree_api_key");
    if (!tok) return;
    if (
      !confirm(
        "This will issue a NEW API key and invalidate the old one. Any existing CLI installs (Claude Code, Codex, Claude Desktop) will need to be re-registered with the new key. Continue?",
      )
    )
      return;
    setRegenerating(true);
    setRegenErr(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/regenerate_key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
      });
      const body = await r.json();
      if (!r.ok) {
        setRegenErr(body?.detail || `Failed (${r.status}).`);
        setRegenerating(false);
        return;
      }
      const newKey = body.api_key;
      if (newKey) {
        // In-memory ONLY — do not persist to localStorage. The user
        // has to copy the key now or never; if they refresh the page,
        // the panel goes back to 'paste your key here'. This matches
        // how every other secret-credentials UI works (Stripe, AWS
        // IAM access keys, GitHub PATs).
        setApiKey(newKey);
        setKeySource("fresh");
        setKeyRevealed(true);  // freshly issued: show by default so the user can copy
      }
    } catch (e: any) {
      setRegenErr(e?.message || "Network error.");
    }
    setRegenerating(false);
  }

  // Manual paste path — the user already has their key saved (from a
  // password manager or signup email) and just wants to pre-fill the
  // snippets here. Stored ONLY in component state for this page load.
  // We deliberately don't persist to localStorage — see the
  // SECURITY note in the init effect above.
  function saveManualKey() {
    const k = manualKeyInput.trim();
    if (!k.startsWith("dt_")) {
      setRegenErr("Keys start with dt_");
      return;
    }
    setApiKey(k);
    setKeySource("pasted");
    setKeyRevealed(false);  // pasted: keep masked by default for shoulder-surf safety
    setManualKeyInput("");
    setRegenErr(null);
  }

  // Clear the active key from this tab (e.g. after the user has saved
  // a freshly-generated key into their password manager). Lets them
  // get the panel out of 'reveal' mode without refreshing the page.
  function clearKey() {
    setApiKey(null);
    setKeySource(null);
    setKeyRevealed(false);
    setManualKeyInput("");
    setRegenErr(null);
  }

  async function mintClient() {
    const tok = sessionStorage.getItem("drawtree_api_key");
    if (!tok) return;
    setMintingClient(true);
    setClientErr(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/oauth_clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({
          client_name: "Drawtree MCP",
          redirect_uris: [
            "https://www.perplexity.ai/oauth/callback",
            "https://perplexity.ai/oauth/callback",
            "https://www.perplexity.ai/rest/connections/oauth_callback",
            "https://perplexity.ai/rest/connections/oauth_callback",
            "https://claude.ai/api/mcp/auth_callback",
            "https://chatgpt.com/oauth/callback",
            "https://chat.openai.com/oauth/callback",
          ],
        }),
      });
      const body = await r.json();
      if (!r.ok) {
        setClientErr(body?.detail || `Failed (${r.status})`);
      } else {
        setClientId(body.client_id);
      }
    } catch (e: any) {
      setClientErr(e?.message || "Network error");
    }
    setMintingClient(false);
  }

  const activeClient = CLIENTS.find((c) => c.key === active)!;
  const isSignedIn = !!agentEmail;
  const isOAuthClient = activeClient.authMode === "oauth";
  const showPerplexityMintButton = active === "perplexity" && isSignedIn && !clientId;

  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      <header className="mb-10">
        <Link
          href="/"
          className="text-xs text-muted underline-offset-4 hover:underline"
        >
          ← Draw Tree
        </Link>
        <h1 className="text-3xl tracking-tight mt-3">Connect Draw Tree to your AI</h1>
        <p className="text-muted mt-2 text-sm leading-relaxed max-w-xl">
          Three steps. Pick your AI client. Paste two things. Run your
          first ticker. New accounts get <strong>50 free credits</strong>{" "}
          — enough to publish your first tree end-to-end.
        </p>
      </header>

      {/* ============================================== */}
      {/* Step 1 — sign in / sign up                     */}
      {/* ============================================== */}
      <section className="mb-6 border border-line rounded p-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-lg">
            <span className="text-muted mr-2">1 ·</span>
            Sign in or create an account
          </h2>
          {isSignedIn && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              ✓ Signed in
            </span>
          )}
        </div>

        {isSignedIn ? (
          <div className="text-sm text-muted">
            Signed in as <strong className="text-ink">{agentEmail}</strong>.{" "}
            {apiKey ? (
              <>
                Your MCP API key is pre-filled in step 2 below.{" "}
              </>
            ) : (
              <>
                <Link
                  href="/account"
                  className="underline-offset-4 hover:underline"
                >
                  Open /account
                </Link>{" "}
                to view your API key.{" "}
              </>
            )}
            <Link
              href="/account"
              className="underline-offset-4 hover:underline"
            >
              Manage account →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Have an account? Enter your email, we&apos;ll send a 6-digit
              code. New here?{" "}
              <Link
                href="/signup"
                className="text-ink underline-offset-4 hover:underline"
              >
                Sign up free →
              </Link>
            </p>
            {signInStage === "email" ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !signInBusy) requestCode();
                  }}
                  placeholder="you@example.com"
                  className="flex-1 px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-ink"
                />
                <button
                  onClick={requestCode}
                  disabled={signInBusy || !signInEmail}
                  className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
                >
                  {signInBusy ? "Sending…" : "Email me a code"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-muted">
                  Code sent to{" "}
                  <strong className="text-ink">{signInEmail}</strong>. Check
                  your inbox.
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={11}
                    value={signInCode}
                    onChange={(e) => setSignInCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !signInBusy) verifyCode();
                    }}
                    placeholder="123 456"
                    className="flex-1 px-3 py-2 text-lg font-mono tracking-widest text-center border border-line rounded focus:outline-none focus:border-ink"
                  />
                  <button
                    onClick={verifyCode}
                    disabled={
                      signInBusy ||
                      signInCode.replace(/\D/g, "").length !== 6
                    }
                    className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
                  >
                    {signInBusy ? "Verifying…" : "Sign in"}
                  </button>
                </div>
                <div className="flex justify-between text-[11px] text-muted">
                  <button
                    onClick={() => {
                      setSignInStage("email");
                      setSignInCode("");
                      setSignInErr(null);
                    }}
                    className="underline-offset-4 hover:underline"
                  >
                    ← Change email
                  </button>
                  <button
                    onClick={() => {
                      setSignInCode("");
                      requestCode();
                    }}
                    className="underline-offset-4 hover:underline"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}
            {signInErr && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {signInErr}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================== */}
      {/* Step 2 — pick an AI client + install           */}
      {/* ============================================== */}
      <section className="mb-6 border border-line rounded p-6">
        <h2 className="text-lg mb-3">
          <span className="text-muted mr-2">2 ·</span>
          Install Draw Tree on your AI
        </h2>
        <p className="text-sm text-muted mb-4">
          Pick where you want to use Draw Tree. Web clients use{" "}
          <strong>OAuth</strong> (one-click sign-in). CLI clients use your
          API key directly.
        </p>

        {/* Client tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
          {CLIENTS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`text-xs px-3 py-2 rounded border text-left transition ${
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

        {/* Auth-mode banner */}
        <div className="text-[11px] text-muted mb-4 px-3 py-2 bg-paper-2 border border-line rounded">
          {isOAuthClient ? (
            <>
              <strong className="text-ink">{activeClient.label}</strong> uses{" "}
              <strong>OAuth</strong>. You don&apos;t need to copy your API
              key — sign-in happens in a popup window.
            </>
          ) : (
            <>
              <strong className="text-ink">{activeClient.label}</strong> uses
              your <strong>API key</strong>{" "}
              {apiKey ? (
                <>
                  (pre-filled below —{" "}
                  <span className="font-mono">{apiKey.slice(0, 10)}…</span>
                  {keySource === "fresh" && (
                    <span className="ml-2 text-emerald-700">
                      ✨ just generated
                    </span>
                  )}
                  ).
                </>
              ) : (
                <>
                  — either paste the key from your signup email below, or
                  generate a new one.
                </>
              )}
            </>
          )}
        </div>

        {/* ============================================================
            API key panel — only shown when the active client uses
            Bearer auth. Three modes (see keySource state up top):
              - apiKey === null → empty paste-or-generate form
              - keySource === 'fresh' → green callout, shown by default,
                  with 'save it now' warning + 'I've saved it' button
              - keySource === 'pasted' → masked prefix with reveal eye
            ============================================================ */}
        {!isOAuthClient && (
          <div className="mb-5 border border-line rounded p-3 bg-paper-2/40 space-y-3">
            {/* Mode 1: freshly generated key — must save now */}
            {apiKey && keySource === "fresh" && (
              <div className="border border-emerald-300 bg-emerald-50/50 rounded p-3 space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-800 font-medium">
                    ✨ New API key — save it now
                  </div>
                  <button
                    onClick={clearKey}
                    className="text-[11px] text-emerald-800 hover:underline underline-offset-4"
                  >
                    I&apos;ve saved it ✓
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono break-all bg-white border border-emerald-200 rounded px-2 py-1.5">
                    {keyRevealed ? apiKey : maskKey(apiKey)}
                  </code>
                  <button
                    onClick={() => setKeyRevealed((v) => !v)}
                    className="px-2 py-1.5 text-xs border border-emerald-200 rounded hover:bg-emerald-100 shrink-0"
                    title={keyRevealed ? "Hide" : "Reveal"}
                  >
                    {keyRevealed ? "🔒 Hide" : "👁 Reveal"}
                  </button>
                  <Copy text={apiKey} />
                </div>
                <div className="text-[11px] text-emerald-900 leading-relaxed">
                  This is the <strong>only time</strong> the key is visible.
                  Copy it into your password manager (1Password, Bitwarden,
                  Apple Keychain…) right now. After you refresh the page or
                  click <em>I&apos;ve saved it</em>, you&apos;ll have to
                  regenerate to see another one (which invalidates this one).
                </div>
              </div>
            )}

            {/* Mode 2: previously-pasted key — masked by default */}
            {apiKey && keySource === "pasted" && (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted">
                    Active API key (this tab only)
                  </div>
                  <button
                    onClick={clearKey}
                    className="text-[11px] text-muted hover:underline underline-offset-4"
                  >
                    Use a different key
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono break-all bg-paper border border-line rounded px-2 py-1.5">
                    {keyRevealed ? apiKey : maskKey(apiKey)}
                  </code>
                  <button
                    onClick={() => setKeyRevealed((v) => !v)}
                    className="px-2 py-1.5 text-xs border border-line rounded hover:bg-paper-2 shrink-0"
                    title={keyRevealed ? "Hide" : "Reveal"}
                  >
                    {keyRevealed ? "🔒 Hide" : "👁 Reveal"}
                  </button>
                  <Copy text={apiKey} />
                </div>
                <div className="text-[10px] text-muted">
                  The key fills the install snippets below. Not saved —
                  paste again next time, or use a password-manager
                  autofill.
                </div>
              </div>
            )}

            {/* Mode 3: empty — paste existing OR generate new */}
            {!apiKey && (
              <div className="space-y-4">
                {/* Paste-existing path */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-ink">
                    Have your key?
                  </div>
                  <div className="text-[11px] text-muted">
                    Paste it from your password manager (or the
                    &ldquo;Welcome to Draw Tree&rdquo; email). Stays in
                    this tab only.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      value={manualKeyInput}
                      onChange={(e) => setManualKeyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && manualKeyInput.startsWith("dt_")) {
                          saveManualKey();
                        }
                      }}
                      placeholder="dt_xxxxxxxx…"
                      className="flex-1 px-3 py-2 text-xs font-mono border border-line rounded focus:outline-none focus:border-ink"
                    />
                    <button
                      onClick={saveManualKey}
                      disabled={!manualKeyInput.startsWith("dt_")}
                      className="px-4 py-2 text-xs border border-line rounded hover:bg-paper-2 disabled:opacity-50"
                    >
                      Use this key
                    </button>
                  </div>
                </div>

                {/* Divider + Generate path (signed-in only) */}
                {isSignedIn ? (
                  <div className="border-t border-line pt-3 space-y-2">
                    <div className="text-xs font-medium text-ink">
                      Lost your key, or first time setting up?
                    </div>
                    <div className="text-[11px] text-muted">
                      Generate a fresh one. This{" "}
                      <strong>invalidates the previous key</strong> — any
                      AI client currently using the old key will stop
                      working until you update it.
                    </div>
                    <button
                      onClick={regenerateKey}
                      disabled={regenerating}
                      className="px-4 py-2 text-xs bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
                    >
                      {regenerating ? "Generating…" : "Generate new API key"}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-line pt-3 text-[11px] text-muted">
                    Want to generate a new key? Sign in at step 1 above.
                  </div>
                )}

                {regenErr && (
                  <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                    {regenErr}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected client's install body */}
        <div className="mb-3">{activeClient.body(apiKey || "", clientId)}</div>

        {/* Perplexity-only: mint Client ID */}
        {showPerplexityMintButton && (
          <div className="mt-4 border border-line rounded p-3 bg-paper-2/40">
            <div className="text-xs text-muted mb-2">
              Perplexity asks you to paste a Client ID. Generate one now —
              we&apos;ll register it under your account so you can revoke
              it later from <code>/account</code>.
            </div>
            <button
              onClick={mintClient}
              disabled={mintingClient}
              className="px-3 py-1.5 text-xs bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
            >
              {mintingClient ? "Generating…" : "Generate Client ID"}
            </button>
            {clientErr && (
              <div className="mt-2 text-[11px] text-red-700">
                {clientErr}
              </div>
            )}
          </div>
        )}

        {active === "perplexity" && clientId && (
          <div className="mt-4 border border-emerald-200 rounded p-3 bg-emerald-50/30 space-y-2">
            <div className="text-xs text-muted">
              Your Client ID (paste into Perplexity):
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-paper border border-line rounded px-2 py-1 break-all">
                {clientId}
              </code>
              <Copy text={clientId} />
            </div>
          </div>
        )}

        {/* MCP URL fallback */}
        <div className="mt-5 pt-3 border-t border-line flex items-center gap-3 text-[11px] text-muted">
          <span>MCP server URL:</span>
          <code className="font-mono">{MCP_URL}</code>
          <Copy text={MCP_URL} label="Copy URL" />
        </div>
      </section>

      {/* ============================================== */}
      {/* Step 3 — install the Draw Tree skill / agent file */}
      {/* ============================================== */}
      <section className="mb-6 border border-line rounded p-6">
        <h2 className="text-lg mb-3">
          <span className="text-muted mr-2">3 ·</span>
          Install the Draw Tree skill
        </h2>
        <p className="text-sm text-muted mb-4">
          The skill teaches your AI <em>how</em> to drive the Draw Tree
          workflow correctly (entry gate, Phase 1 stages, Phase 2 deep
          research, etc.). Each client has its own install path — pick
          yours below.
        </p>

        {/* Same tabs as Step 2 — driven off the active state, so the user
            doesn't have to scroll up to switch. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
          {CLIENTS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`text-xs px-3 py-2 rounded border text-left transition ${
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

        {/* Per-client skill install body. */}
        <SkillInstallPanel client={active} />

        {/* Always-available fallback: copy raw prompt for clients with
            no native skill primitive yet. */}
        <details className="mt-5 border-t border-line pt-4">
          <summary className="text-xs text-muted cursor-pointer hover:text-ink select-none">
            Show raw instructions (for any client that has no skill primitive)
          </summary>
          <pre className="mt-3 bg-paper-2 border border-line rounded p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-80">
            {STARTER_PROMPT}
          </pre>
          <div className="mt-2">
            <Copy text={STARTER_PROMPT} label="Copy raw instructions" />
          </div>
        </details>

        <div className="mt-4 text-[11px] text-muted border-t border-line pt-3">
          <strong className="text-ink">After installing:</strong> open a
          new chat in your AI client and just say{" "}
          <em>&ldquo;I want to analyze NVDA&rdquo;</em> (or any ticker).
          The skill auto-activates and walks you through Phase 1 → Phase 2.
        </div>
      </section>

      {/* ============================================== */}
      {/* Pricing reference                              */}
      {/* ============================================== */}
      <section className="mb-8 border border-line rounded p-6 text-sm">
        <h2 className="text-lg mb-3">Credits at a glance</h2>
        <p className="text-muted text-xs mb-4">
          $1 USD = 10 credits. Phase 1 design is always free. Phase 2 deep
          research is a single 50-credit bundle. Weekly monitoring is 5
          credits per run.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
          <div>
            <div className="text-ink uppercase tracking-wider mb-2">
              First tree (typical)
            </div>
            <ul className="space-y-0.5 text-muted">
              <li>Phase 1 (framework design) — free</li>
              <li>Phase 2 (research + commit) — 50 cr flat</li>
              <li>First week of monitoring — 5 cr</li>
              <li>
                <strong className="text-ink">Total: 55 cr</strong>{" "}
                — covered by the 50 free signup credits plus a single
                $5 top-up (50 cr).
              </li>
            </ul>
          </div>
          <div>
            <div className="text-ink uppercase tracking-wider mb-2">
              Top-up tiers
            </div>
            <ul className="space-y-0.5 text-muted">
              <li>$5 → 50 cr</li>
              <li>$10 → 100 cr</li>
              <li>$50 → 500 cr</li>
              <li>$100 → 1000 cr</li>
              <li>$500 → 5000 cr</li>
            </ul>
            <Link
              href="/account"
              className="inline-block mt-2 text-ink underline-offset-4 hover:underline"
            >
              Top up at /account →
            </Link>
          </div>
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
          <a
            href="mailto:founder@peter-ai.app"
            className="underline-offset-4 hover:underline"
          >
            Email support
          </a>
        </div>
      </footer>
    </main>
  );
}

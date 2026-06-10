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
//
// All copy lives in lib/i18n/messages (en/zh); the starter prompt and
// skill downloads are served in the visitor's locale.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { Messages } from "@/lib/i18n/messages";
import { getSystemPrompt } from "@/lib/skill_content";

const API_URL  = "https://drawtree-api.onrender.com";
const MCP_URL  = "https://drawtree-mcp.onrender.com/mcp";

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
  authMode: "oauth" | "apikey";
  // Inline step-by-step rendered as JSX (so we can include code blocks
  // with the user's actual key / client_id pre-filled). Receives the
  // active message catalog so each client body renders in-locale.
  body: (apiKey: string, clientId: string | null, m: Messages) => JSX.Element;
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
    authMode: "oauth",
    body: (_apiKey, _clientId, m) => (
      <ol className="text-sm space-y-2 list-decimal list-inside text-muted">
        {m.start.chatgptSteps(<MonoLine>{MCP_URL}</MonoLine>).map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    ),
  },
  {
    key: "claude_ai",
    label: "Claude.ai",
    authMode: "oauth",
    body: (_apiKey, _clientId, m) => (
      <ol className="text-sm space-y-2 list-decimal list-inside text-muted">
        {m.start.claudeAiSteps(<MonoLine>{MCP_URL}</MonoLine>).map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    ),
  },
  {
    key: "perplexity",
    label: "Perplexity",
    authMode: "oauth",  // shows the OAuth section + the API-key alternative below
    body: (apiKey, clientId, m) => (
      <div className="text-sm space-y-5 text-muted">
        {/* Common preamble: open the custom-connector dialog. */}
        <p className="text-[12px]">{m.start.perplexityHeadsUp}</p>
        <ol className="space-y-2 list-decimal list-inside">
          {m.start
            .perplexityCommonSteps(<MonoLine>{MCP_URL}</MonoLine>)
            .map((step, i) => (
              <li key={i}>{step}</li>
            ))}
        </ol>

        {/* Option A — API key (simplest if you already have a dt_ key). */}
        <div className="border border-line rounded p-3 bg-paper-2/40 space-y-2">
          <div className="text-xs font-medium text-ink">
            {m.start.perplexityOptionA}
          </div>
          <ol className="space-y-1 list-decimal list-inside text-[12.5px]">
            <li>{m.start.perplexityOptA1}</li>
            <li>
              {apiKey
                ? m.start.perplexityOptA2WithKey(`${apiKey.slice(0, 10)}…`)
                : m.start.perplexityOptA2NoKey}
            </li>
            <li>{m.start.perplexityOptA3}</li>
          </ol>
          <p className="text-[11px] text-muted">{m.start.perplexityOptANote}</p>
        </div>

        {/* Option B — OAuth (more secure, requires per-user consent). */}
        <div className="border border-line rounded p-3 bg-paper-2/40 space-y-2">
          <div className="text-xs font-medium text-ink">
            {m.start.perplexityOptionB}
          </div>
          <ol className="space-y-1 list-decimal list-inside text-[12.5px]">
            <li>{m.start.perplexityOptB1}</li>
            <li>
              {m.start.perplexityOptB2Label}{" "}
              {clientId ? (
                <MonoLine>{clientId}</MonoLine>
              ) : (
                <span className="text-[11px]">
                  {m.start.perplexityOptB2NoClient}
                </span>
              )}
            </li>
            <li>{m.start.perplexityOptB3}</li>
            <li>{m.start.perplexityOptB4}</li>
          </ol>
          <p className="text-[11px] text-muted">{m.start.perplexityOptBNote}</p>
        </div>
      </div>
    ),
  },
  {
    key: "claude_code",
    label: "Claude Code",
    authMode: "apikey",
    body: (apiKey, _clientId, m) => (
      <div className="text-sm space-y-3 text-muted">
        <p>{m.start.claudeCodeRun}</p>
        <pre className="bg-paper-2 border border-line rounded p-3 text-[12px] overflow-x-auto whitespace-pre-wrap">
{`claude mcp add drawtree \\
  --transport http \\
  --header "Authorization: Bearer ${apiKey || "dt_xxxxxxxx"}" \\
  ${MCP_URL}`}
        </pre>
        <p className="text-[11px]">{m.start.claudeCodeRestart}</p>
      </div>
    ),
  },
  {
    key: "codex",
    label: "Codex CLI",
    authMode: "apikey",
    body: (apiKey, _clientId, m) => (
      <div className="text-sm space-y-3 text-muted">
        <p>{m.start.codexIntro}</p>
        <pre className="bg-paper-2 border border-line rounded p-3 text-[12px] overflow-x-auto whitespace-pre-wrap">
{`${m.start.codexSnippetComment1}
export DRAWTREE_API_KEY="${apiKey || "dt_xxxxxxxx"}"

${m.start.codexSnippetComment2}
[mcp_servers.drawtree]
url = "${MCP_URL}"
bearer_token_env_var = "DRAWTREE_API_KEY"`}
        </pre>
        <p className="text-[11px]">{m.start.codexAfter}</p>
      </div>
    ),
  },
  {
    key: "claude_desktop",
    label: "Claude Desktop",
    authMode: "apikey",
    body: (apiKey, _clientId, m) => (
      <div className="text-sm space-y-3 text-muted">
        <p>{m.start.claudeDesktopIntro}</p>
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
        <p className="text-[11px]">{m.start.claudeDesktopAfter}</p>
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
// The lang param picks the en/zh body (with the matching language rule
// baked into the prompt text).
const SKILL_MD_URL  = "/api/skill/skill.md";
const SKILL_ZIP_URL = "/api/skill/skill.zip";
const AGENTS_MD_URL = "/api/skill/agents.md";

// Per-client skill install panel. Renders the right install path for
// each AI client — different file format + different drop location for
// each. Centralised here so step 3 always reflects what step 2 selected.
function SkillInstallPanel({ client }: { client: ClientKey }) {
  const { m, locale } = useI18n();
  const skillMdUrl  = `${SKILL_MD_URL}?lang=${locale}`;
  const skillZipUrl = `${SKILL_ZIP_URL}?lang=${locale}`;
  const agentsMdUrl = `${AGENTS_MD_URL}?lang=${locale}`;
  switch (client) {
    case "chatgpt":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>{m.start.skillChatgptIntro}</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>{m.start.skillChatgptOpt1}</li>
            <li>{m.start.skillChatgptOpt2}</li>
          </ol>
        </div>
      );

    case "claude_ai":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>{m.start.skillClaudeAiIntro}</p>
          <ol className="list-decimal list-inside space-y-2">
            {m.start.skillClaudeAiSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <DownloadRow
            href={skillZipUrl}
            filename="drawtree-skill.zip"
            label={m.start.downloadSkillZip}
          />
        </div>
      );

    case "perplexity":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>{m.start.skillPerplexityIntro}</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>{m.start.skillPerplexityStep1}</li>
            <li>
              {m.start.skillPerplexityStep2(
                <a
                  href="https://www.perplexity.ai/computer/skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline-offset-4 hover:underline"
                >
                  perplexity.ai/computer/skills
                </a>,
              )}
            </li>
            <li>{m.start.skillPerplexityStep3}</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <DownloadRow
              href={skillMdUrl}
              filename="drawtree-SKILL.md"
              label={m.start.downloadSkillMd}
            />
            <DownloadRow
              href={skillZipUrl}
              filename="drawtree-skill.zip"
              label={m.start.downloadSkillZip}
              secondary
            />
          </div>
        </div>
      );

    case "claude_code":
      return (
        <div className="text-sm space-y-4 text-muted">
          <p>{m.start.skillClaudeCodeIntro}</p>

          {/* PRIMARY — one-click browser download + paste prompt */}
          <div className="border border-emerald-300 bg-emerald-50/40 rounded p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-emerald-800 font-medium">
              {m.start.recommendedTwoClicks}
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[13px]">
              <li>{m.start.skillClaudeCodeStep1}</li>
              <li>{m.start.skillClaudeCodeStep2}</li>
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              <DownloadRow
                href={skillMdUrl}
                filename="SKILL.md"
                label={m.start.downloadSkillMd}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono bg-white border border-emerald-200 rounded px-2 py-1.5">
                {m.start.skillClaudeCodePastePrompt}
              </code>
              <Copy text={m.start.skillClaudeCodePastePrompt} />
            </div>
            <p className="text-[11px] text-emerald-900">
              {m.start.skillClaudeCodeVerify}
            </p>
          </div>

          {/* SECONDARY — manual terminal install (no Claude needed) */}
          <details className="text-[12px]">
            <summary className="cursor-pointer hover:text-ink">
              {m.start.preferTerminal}
            </summary>
            <div className="mt-2 space-y-2 pl-3 border-l-2 border-line">
              <p>{m.start.skillClaudeCodeManual}</p>
              <pre className="bg-paper-2 border border-line rounded p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`mkdir -p ~/.claude/skills/drawtree && \\
  curl -L "https://drawtree.capital${skillMdUrl}" \\
  -o ~/.claude/skills/drawtree/SKILL.md`}
              </pre>
              <div className="flex justify-end">
                <Copy
                  text={`mkdir -p ~/.claude/skills/drawtree && curl -L "https://drawtree.capital${skillMdUrl}" -o ~/.claude/skills/drawtree/SKILL.md`}
                  label={m.start.copyCommand}
                />
              </div>
            </div>
          </details>
        </div>
      );

    case "codex":
      return (
        <div className="text-sm space-y-4 text-muted">
          <p>{m.start.skillCodexIntro}</p>

          {/* PRIMARY — one-click browser download + paste prompt */}
          <div className="border border-emerald-300 bg-emerald-50/40 rounded p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-emerald-800 font-medium">
              {m.start.recommendedTwoClicks}
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[13px]">
              <li>{m.start.skillCodexStep1}</li>
              <li>{m.start.skillCodexStep2}</li>
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              <DownloadRow
                href={agentsMdUrl}
                filename="AGENTS.md"
                label={m.start.downloadAgentsMd}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono bg-white border border-emerald-200 rounded px-2 py-1.5">
                {m.start.skillCodexPastePrompt}
              </code>
              <Copy text={m.start.skillCodexPastePrompt} />
            </div>
            <p className="text-[11px] text-emerald-900">
              {m.start.skillCodexVerify}
            </p>
          </div>

          {/* SECONDARY — manual terminal install */}
          <details className="text-[12px]">
            <summary className="cursor-pointer hover:text-ink">
              {m.start.preferTerminalShort}
            </summary>
            <div className="mt-2 space-y-2 pl-3 border-l-2 border-line">
              <p>{m.start.skillCodexManual}</p>
              <pre className="bg-paper-2 border border-line rounded p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`mkdir -p ~/.codex && \\
  curl -L "https://drawtree.capital${agentsMdUrl}" \\
  -o ~/.codex/AGENTS.md`}
              </pre>
              <div className="flex justify-end">
                <Copy
                  text={`mkdir -p ~/.codex && curl -L "https://drawtree.capital${agentsMdUrl}" -o ~/.codex/AGENTS.md`}
                  label={m.start.copyCommand}
                />
              </div>
              <p className="text-[11px]">{m.start.skillCodexPerProject}</p>
            </div>
          </details>
        </div>
      );

    case "claude_desktop":
      return (
        <div className="text-sm space-y-3 text-muted">
          <p>{m.start.skillClaudeDesktopIntro}</p>
          <ol className="list-decimal list-inside space-y-2">
            {m.start.skillClaudeDesktopSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <DownloadRow
            href={skillZipUrl}
            filename="drawtree-skill.zip"
            label={m.start.downloadSkillZip}
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

function Copy({ text, label }: { text: string; label?: string }) {
  const { m } = useI18n();
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
      {copied ? m.common.copied : label || m.common.copy}
    </button>
  );
}

export default function Start() {
  const { m, locale } = useI18n();

  // The starter prompt in the visitor's language — bakes in the
  // matching language rule (language='en' / language='zh').
  const starterPrompt = getSystemPrompt(locale);

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
      setSignInErr(m.signin.invalidEmail);
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
        setSignInErr(m.signin.notRegisteredStart);
        setSignInBusy(false);
        return;
      }
      setSignInStage("code");
    } catch (e: any) {
      setSignInErr(e?.message || m.signin.networkSend);
    }
    setSignInBusy(false);
  }, [signInEmail, m]);

  const verifyCode = useCallback(async () => {
    const cleaned = signInCode.replace(/\D/g, "");
    if (cleaned.length !== 6) {
      setSignInErr(m.signin.codeIs6Digits);
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
          c === "INVALID_CODE"        ? m.signin.codeMismatch :
          c === "CODE_ALREADY_USED"   ? m.signin.codeUsed :
          c === "CODE_EXPIRED"        ? m.signin.codeExpired :
          c === "INVALID_CODE_FORMAT" ? m.signin.codeFormat :
          m.signin.signInFailed(r.status);
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
      setSignInErr(e?.message || m.signin.networkVerify);
      setSignInBusy(false);
    }
  }, [signInCode, signInEmail, m]);

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
    if (!confirm(m.start.regenerateConfirm)) return;
    setRegenerating(true);
    setRegenErr(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/regenerate_key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
      });
      const body = await r.json();
      if (!r.ok) {
        setRegenErr(body?.detail || m.start.failed(r.status));
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
      setRegenErr(e?.message || m.start.networkError);
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
      setRegenErr(m.start.keysStartWith);
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
        setClientErr(body?.detail || m.start.failed(r.status));
      } else {
        setClientId(body.client_id);
      }
    } catch (e: any) {
      setClientErr(e?.message || m.start.networkError);
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
          {m.common.backToDrawTree}
        </Link>
        <h1 className="text-3xl tracking-tight mt-3">{m.start.title}</h1>
        <p className="text-muted mt-2 text-sm leading-relaxed max-w-xl">
          {m.start.intro}
        </p>
      </header>

      {/* ============================================== */}
      {/* Step 1 — sign in / sign up                     */}
      {/* ============================================== */}
      <section className="mb-6 border border-line rounded p-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-lg">
            <span className="text-muted mr-2">1 ·</span>
            {m.start.step1Title}
          </h2>
          {isSignedIn && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {m.start.signedInBadge}
            </span>
          )}
        </div>

        {isSignedIn ? (
          <div className="text-sm text-muted">
            {m.start.signedInAs(agentEmail)}
            {apiKey ? m.start.keyShownBelow : m.start.generateBelow}
            <Link
              href="/account"
              className="underline-offset-4 hover:underline"
            >
              {m.start.manageAccount}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {m.start.haveAccountPrompt}
              <Link
                href="/signup"
                className="text-ink underline-offset-4 hover:underline"
              >
                {m.start.signUpFree}
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
                  placeholder={m.signup.emailPlaceholder}
                  className="flex-1 px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-ink"
                />
                <button
                  onClick={requestCode}
                  disabled={signInBusy || !signInEmail}
                  className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
                >
                  {signInBusy ? m.signin.sending : m.signin.emailMeCode}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-muted">
                  {m.signin.codeSentTo(signInEmail)}
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
                    placeholder={m.signin.codePlaceholder}
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
                    {signInBusy ? m.signin.verifying : m.signin.signIn}
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
                    {m.signin.changeEmail}
                  </button>
                  <button
                    onClick={() => {
                      setSignInCode("");
                      requestCode();
                    }}
                    className="underline-offset-4 hover:underline"
                  >
                    {m.signin.resendCode}
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
      {/* Step 2 — your API key (standalone, always shown) */}
      {/* ============================================== */}
      <section className="mb-6 border border-line rounded p-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-lg">
            <span className="text-muted mr-2">2 ·</span>
            {m.start.step2Title}
          </h2>
          {apiKey && (
            <span className="text-[11px] text-emerald-700">
              {m.start.readyToPaste}
            </span>
          )}
        </div>
        <p className="text-sm text-muted mb-4">{m.start.step2Intro}</p>

        <div className="border border-line rounded p-3 bg-paper-2/40 space-y-3">
          {/* Mode 1: freshly generated key — must save now */}
          {apiKey && keySource === "fresh" && (
            <div className="border border-emerald-300 bg-emerald-50/50 rounded p-3 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[10px] uppercase tracking-wider text-emerald-800 font-medium">
                  {m.start.freshKeyTitle}
                </div>
                <button
                  onClick={clearKey}
                  className="text-[11px] text-emerald-800 hover:underline underline-offset-4"
                >
                  {m.start.savedIt}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono break-all bg-white border border-emerald-200 rounded px-2 py-1.5">
                  {keyRevealed ? apiKey : maskKey(apiKey)}
                </code>
                <button
                  onClick={() => setKeyRevealed((v) => !v)}
                  className="px-2 py-1.5 text-xs border border-emerald-200 rounded hover:bg-emerald-100 shrink-0"
                  title={keyRevealed ? m.start.hide : m.start.reveal}
                >
                  {keyRevealed ? m.start.hide : m.start.reveal}
                </button>
                <Copy text={apiKey} />
              </div>
              <div className="text-[11px] text-emerald-900 leading-relaxed">
                {m.start.freshKeyNote}
              </div>
            </div>
          )}

          {/* Mode 2: previously-pasted key — masked by default */}
          {apiKey && keySource === "pasted" && (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  {m.start.activeKeyTitle}
                </div>
                <button
                  onClick={clearKey}
                  className="text-[11px] text-muted hover:underline underline-offset-4"
                >
                  {m.start.useDifferentKey}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono break-all bg-paper border border-line rounded px-2 py-1.5">
                  {keyRevealed ? apiKey : maskKey(apiKey)}
                </code>
                <button
                  onClick={() => setKeyRevealed((v) => !v)}
                  className="px-2 py-1.5 text-xs border border-line rounded hover:bg-paper-2 shrink-0"
                  title={keyRevealed ? m.start.hide : m.start.reveal}
                >
                  {keyRevealed ? m.start.hide : m.start.reveal}
                </button>
                <Copy text={apiKey} />
              </div>
              <div className="text-[10px] text-muted">
                {m.start.pastedKeyNote}
              </div>
            </div>
          )}

          {/* Mode 3: empty — paste existing OR generate new */}
          {!apiKey && (
            <div className="space-y-4">
              {/* Paste-existing path */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-ink">
                  {m.start.haveYourKey}
                </div>
                <div className="text-[11px] text-muted">
                  {m.start.pasteFromManager}
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
                    {m.start.useThisKey}
                  </button>
                </div>
              </div>

              {/* Divider + Generate path (signed-in only) */}
              {isSignedIn ? (
                <div className="border-t border-line pt-3 space-y-2">
                  <div className="text-xs font-medium text-ink">
                    {m.start.lostKeyTitle}
                  </div>
                  <div className="text-[11px] text-muted">
                    {m.start.generateNote}
                  </div>
                  <button
                    onClick={regenerateKey}
                    disabled={regenerating}
                    className="px-4 py-2 text-xs bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
                  >
                    {regenerating ? m.start.generating : m.start.generateButton}
                  </button>
                </div>
              ) : (
                <div className="border-t border-line pt-3 text-[11px] text-muted">
                  {m.start.signInToGenerate}
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
      </section>

      {/* ============================================== */}
      {/* Step 3 — pick an AI client + install           */}
      {/* ============================================== */}
      <section className="mb-6 border border-line rounded p-6">
        <h2 className="text-lg mb-3">
          <span className="text-muted mr-2">3 ·</span>
          {m.start.step3Title}
        </h2>
        <p className="text-sm text-muted mb-4">{m.start.step3Intro}</p>

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
              <div className="text-[10px] opacity-70 mt-0.5">
                {m.start.taglines[c.key]}
              </div>
            </button>
          ))}
        </div>

        {/* Auth-mode banner */}
        <div className="text-[11px] text-muted mb-4 px-3 py-2 bg-paper-2 border border-line rounded">
          {active === "perplexity" ? (
            m.start.bannerPerplexity
          ) : isOAuthClient ? (
            m.start.bannerOAuth(activeClient.label)
          ) : apiKey ? (
            m.start.bannerApiKeyWithKey(
              activeClient.label,
              `${apiKey.slice(0, 10)}…`,
              keySource === "fresh",
            )
          ) : (
            m.start.bannerApiKeyNoKey(activeClient.label)
          )}
        </div>


        {/* Selected client's install body */}
        <div className="mb-3">{activeClient.body(apiKey || "", clientId, m)}</div>

        {/* Perplexity-only: mint Client ID */}
        {showPerplexityMintButton && (
          <div className="mt-4 border border-line rounded p-3 bg-paper-2/40">
            <div className="text-xs text-muted mb-2">{m.start.mintIntro}</div>
            <button
              onClick={mintClient}
              disabled={mintingClient}
              className="px-3 py-1.5 text-xs bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
            >
              {mintingClient ? m.start.minting : m.start.mintButton}
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
            <div className="text-xs text-muted">{m.start.yourClientId}</div>
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
          <span>{m.start.mcpUrlLabel}</span>
          <code className="font-mono">{MCP_URL}</code>
          <Copy text={MCP_URL} label={m.common.copyUrl} />
        </div>
      </section>

      {/* ============================================== */}
      {/* Step 4 — install the Draw Tree skill / agent file */}
      {/* ============================================== */}
      <section className="mb-6 border border-line rounded p-6">
        <h2 className="text-lg mb-3">
          <span className="text-muted mr-2">4 ·</span>
          {m.start.step4Title}
        </h2>
        <p className="text-sm text-muted mb-4">{m.start.step4Intro}</p>

        {/* Same tabs as Step 3 — driven off the active state, so the user
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
              <div className="text-[10px] opacity-70 mt-0.5">
                {m.start.taglines[c.key]}
              </div>
            </button>
          ))}
        </div>

        {/* Per-client skill install body. */}
        <SkillInstallPanel client={active} />

        {/* Always-available fallback: copy raw prompt for clients with
            no native skill primitive yet. */}
        <details className="mt-5 border-t border-line pt-4">
          <summary className="text-xs text-muted cursor-pointer hover:text-ink select-none">
            {m.start.rawInstructionsSummary}
          </summary>
          <pre className="mt-3 bg-paper-2 border border-line rounded p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-80">
            {starterPrompt}
          </pre>
          <div className="mt-2">
            <Copy text={starterPrompt} label={m.start.copyRawInstructions} />
          </div>
        </details>

        <div className="mt-4 text-[11px] text-muted border-t border-line pt-3">
          {m.start.afterInstalling}
        </div>
      </section>

      {/* ============================================== */}
      {/* Pricing reference                              */}
      {/* ============================================== */}
      <section className="mb-8 border border-line rounded p-6 text-sm">
        <h2 className="text-lg mb-3">{m.start.pricingTitle}</h2>
        <p className="text-muted text-xs mb-4">{m.start.pricingIntro}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
          <div>
            <div className="text-ink uppercase tracking-wider mb-2">
              {m.start.firstTree}
            </div>
            <ul className="space-y-0.5 text-muted">
              {m.start.firstTreeItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-ink uppercase tracking-wider mb-2">
              {m.start.topupTiers}
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
              {m.start.topupAtAccount}
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-xs text-muted text-center pt-4 border-t border-line">
        <div className="flex justify-center gap-4">
          <Link href="/spec" className="underline-offset-4 hover:underline">
            {m.start.footerSpec}
          </Link>
          <Link href="/account" className="underline-offset-4 hover:underline">
            {m.common.myAccount}
          </Link>
          <a
            href="mailto:founder@peter-ai.app"
            className="underline-offset-4 hover:underline"
          >
            {m.start.footerSupport}
          </a>
        </div>
      </footer>
    </main>
  );
}

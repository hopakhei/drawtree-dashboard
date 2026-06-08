"use client";

// Fallback "Manual OAuth credentials" card. Most clients (Claude.ai,
// Claude Desktop, Claude Code) can register themselves via Dynamic
// Client Registration, so users normally never touch this section.
// But a few MCP clients — Perplexity, in particular — refuse to do
// DCR and demand the user paste a Client ID into the form. This card
// lets the user mint one in two clicks.
//
// The minted client is a PKCE public client; no secret is needed. If
// the client UI insists on a secret, the response includes a
// placeholder string ("none-required") that satisfies the form.

import { useCallback, useEffect, useState } from "react";

const API_URL = "https://drawtree-api.onrender.com";

// Known redirect URIs for every MCP client that may require a manual
// paste. Pre-registering all of them on every new client means the
// same client_id works whether the user later switches between
// Perplexity, Claude.ai, ChatGPT etc. without having to re-mint.
//
// Perplexity uses TWO different callback paths depending on the build
// (/oauth/callback for the old flow, /rest/connections/oauth_callback
// for the current 2026-06 flow). Include both so we're forward and
// backward compatible.
const PRE_REGISTERED_URIS: string[] = [
  // Perplexity
  "https://www.perplexity.ai/oauth/callback",
  "https://perplexity.ai/oauth/callback",
  "https://www.perplexity.ai/rest/connections/oauth_callback",
  "https://perplexity.ai/rest/connections/oauth_callback",
  // Claude
  "https://claude.ai/api/mcp/auth_callback",
  // ChatGPT
  "https://chatgpt.com/oauth/callback",
  "https://chat.openai.com/oauth/callback",
];

type Client = {
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  created_at: string;
};

export default function ManualOAuthCard({ apiKey }: { apiKey: string }) {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!apiKey) return;
    try {
      const r = await fetch(`${API_URL}/v1/account/oauth_clients`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (r.ok) {
        const d = await r.json();
        setClients(d.clients || []);
      } else {
        setClients([]);
      }
    } catch {
      setClients([]);
    }
  }, [apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function mint() {
    if (!apiKey) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/oauth_clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          client_name: "My MCP client",
          redirect_uris: PRE_REGISTERED_URIS,
        }),
      });
      const body = await r.json();
      if (!r.ok) {
        setErr(body?.detail || `Failed to create client (${r.status}).`);
        setBusy(false);
        return;
      }
      await load();
    } catch (e: any) {
      setErr(e?.message || "Network error.");
    }
    setBusy(false);
  }

  async function revoke(clientId: string) {
    if (!apiKey) return;
    if (!confirm(`Revoke this client (${clientId.slice(0, 8)}…)? Any AI client using it will need to be reconnected.`))
      return;
    setBusy(true);
    try {
      await fetch(`${API_URL}/v1/account/oauth_clients/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      await load();
    } catch {}
    setBusy(false);
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  return (
    <section className="mt-6 border border-line rounded p-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-baseline justify-between gap-3 text-left"
      >
        <div>
          <h2 className="text-lg">Manual OAuth credentials</h2>
          <p className="text-xs text-muted mt-1">
            Only needed for AI clients that refuse automatic registration
            (currently: <strong>Perplexity</strong>).
          </p>
        </div>
        <span className="text-xs text-muted shrink-0">
          {open ? "Hide ▴" : "Show ▾"}
        </span>
      </button>

      {open && (
        <div className="mt-5">
          {/* Existing clients */}
          {clients && clients.length > 0 && (
            <div className="space-y-3 mb-5">
              {clients.map((c) => (
                <div
                  key={c.client_id}
                  className="border border-line rounded p-3 bg-paper/40"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-xs uppercase tracking-wider text-muted">
                      {c.client_name}
                    </div>
                    <button
                      onClick={() => revoke(c.client_id)}
                      className="text-xs text-muted hover:underline"
                      disabled={busy}
                    >
                      Revoke
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="text-[11px] text-muted mb-0.5">Client ID</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-paper border border-line rounded px-2 py-1 break-all flex-1">
                        {c.client_id}
                      </code>
                      <button
                        onClick={() => copy(c.client_id, c.client_id)}
                        className={`text-xs px-2 py-1 rounded border shrink-0 ${
                          copied === c.client_id
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-line hover:bg-line/30"
                        }`}
                      >
                        {copied === c.client_id ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-[11px] text-muted mb-0.5">
                      Client Secret
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-paper border border-line rounded px-2 py-1 break-all flex-1">
                        none-required
                      </code>
                      <button
                        onClick={() => copy("none-required", `${c.client_id}-sec`)}
                        className={`text-xs px-2 py-1 rounded border shrink-0 ${
                          copied === `${c.client_id}-sec`
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-line hover:bg-line/30"
                        }`}
                      >
                        {copied === `${c.client_id}-sec` ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <div className="text-[10px] text-muted mt-1">
                      This is a PKCE public client — no real secret exists.
                      Paste this placeholder if the form requires a value.
                    </div>
                  </div>
                  <div className="text-[10px] text-muted mt-2">
                    Created {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mint button */}
          <button
            onClick={mint}
            disabled={busy}
            className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
          >
            {busy
              ? "Generating…"
              : clients && clients.length > 0
              ? "Generate another"
              : "Generate Client ID"}
          </button>

          {err && (
            <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {err}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-5 text-[11px] text-muted leading-relaxed border-t border-line pt-3 space-y-2">
            <div>
              <strong className="text-ink">For Perplexity:</strong> Settings →
              Connectors → + Custom connector → MCP server URL:{" "}
              <code>https://drawtree-mcp.onrender.com/mcp</code> → Authentication:{" "}
              <strong>OAuth</strong> → paste the Client ID above (Client Secret
              field accepts <code>none-required</code> or any string).
            </div>
            <div>
              <strong className="text-ink">For Claude.ai / ChatGPT:</strong>{" "}
              You don&apos;t need this section — leave both fields blank in
              their dialog and our server will auto-register a client for
              them.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
